const asyncHandler = require("express-async-handler");
let $ = require("jquery");
const moment = require("moment");
const Transaction = require("../models/Transaction");
const Phase = require("../models/Phase");
const Notification = require("../models/Notification");
const NotificationType = require("../../enum/NotificationType");
const RoleEnum = require("../../enum/RoleEnum");
const User = require("../models/User");

const createPaymentUrl = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error("Chỉ có khách hàng có quyền thanh toán giao dịch");
    }
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let vnpUrl = process.env.vnp_Url;
    let returnUrl = process.env.vnp_ReturnUrl;
    let orderId = moment(date).format("DDHHmmss");
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;
    let OrderInfo = req.body.OrderInfo;
    let OrderType = req.body.OrderType;

    if (OrderType === "Reserving") {
      const transaction = await Transaction.findById(OrderInfo);
      if (!transaction) {
        res.status(404);
        throw new Error("Không tìm thấy giao dịch");
      }
      if (!transaction.customers.includes(req.user.id)) {
        res.status(403);
        throw new Error(
          "Chỉ có khách hàng tham gia timeshare có quyền thanh toán giữ chổ"
        );
      }
      if (transaction.is_reservation_paid) {
        res.status(400);
        throw new Error("Timeshare này đã được thanh toán giữ chổ");
      }
    } else if (OrderType === "Phase") {
      const phase = await Phase.findById(OrderInfo).populate({
        path: "contract_id",
        populate: {
          path: "transaction_id",
        },
      });
      if (!phase) {
        res.status(404);
        throw new Error("Không tìm thấy giai đoạn thanh toán");
      }
      if (!phase.contract_id.transaction_id.customers.includes(req.user.id)) {
        res.status(403);
        throw new Error(
          "Chỉ có khách hàng tham gia timeshare có quyền thanh toán giai đoạn"
        );
      }
      if (phase.phase_no > 1) {
        const pre_phase = await Phase.findOne({
          contract_id: phase.contract_id._id,
          phase_no: phase.phase_no - 1,
        });
        if (!pre_phase.is_payment) {
          res.status(400);
          throw new Error(
            "Giai đoạn trước chưa được thanh toán. Vui lòng thanh toán giai đoạn trước"
          );
        }
      }
      if (phase.is_payment) {
        res.status(400);
        throw new Error("Giai đoạn này đã được thanh toán");
      }
    } else {
      res.status(400);
      throw new Error("Loại giao dịch không phụ hợp");
    }

    let locale = req.body.language;
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = `${OrderInfo} ${OrderType}`;
    vnp_Params["vnp_OrderType"] = "OrderType";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.status(200).json({ vnpUrl });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const VNPayReturn = asyncHandler(async (req, res) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed && vnp_Params["vnp_ResponseCode"] === "00") {
      const vnp_OrderInfo = vnp_Params["vnp_OrderInfo"];
      const orderInfo = vnp_OrderInfo.split("+")[0];
      const orderType = vnp_OrderInfo.split("+")[1];
      if (orderType === "Reserving") {
        const transaction = await Transaction.findById(orderInfo).populate(
          "timeshare_id"
        );
        transaction.is_reservation_paid = true;
        await transaction.save();

        // Update profit for investor
        const investor = await User.findById(
          transaction.timeshare_id.investor_id
        );
        if (!investor.profit || investor.profit === 0) {
          investor.profit = transaction.reservation_price;
        } else {
          investor.profit += transaction.reservation_price;
        }
        await investor.save();

        // Create Notification
        const notification = new Notification({
          user_id: transaction.timeshare_id.investor_id,
          notification_content: "Khách hàng đã chuyển tiền giữ chỗ",
          notification_title:
            NotificationType.NOTI_PAYMENT_BY_RESERVING_TO_INVESTOR,
          notification_type:
            NotificationType.NOTI_PAYMENT_BY_RESERVING_TO_INVESTOR,
          is_read: false,
        });
        await notification.save();
      } else {
        const phase = await Phase.findById(orderInfo).populate({
          path: "contract_id",
          populate: {
            path: "transaction_id",
            populate: { path: "timeshare_id" },
          },
        });
        phase.is_payment = true;
        await phase.save();

        // Update profit for investor
        const investor = await User.findById(
          phase.contract_id.transaction_id.timeshare_id.investor_id
        );
        if (!investor.profit || investor.profit === 0) {
          investor.profit = phase.phase_price;
        } else {
          investor.profit += phase.phase_price;
        }
        await investor.save();

        // Create Notification
        const notification = new Notification({
          user_id: phase.contract_id.transaction_id.timeshare_id.investor_id,
          notification_content: `Khách hàng đã chuyển tiền giai đoạn thanh toán ${phase.phase_no}`,
          notification_title:
            NotificationType.NOTI_PAYMENT_BY_PHASE_TO_INVESTOR,
          notification_type: NotificationType.NOTI_PAYMENT_BY_PHASE_TO_INVESTOR,
          is_read: false,
        });
        await notification.save();
      }

      res.render("success_vnpay", {
        vnp_TransactionNo: vnp_Params["vnp_TransactionNo"],
      });
    } else {
      res.render("error_vnpay", {
        vnp_TransactionNo: vnp_Params["vnp_TransactionNo"],
      });
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = {
  createPaymentUrl,
  VNPayReturn,
};
