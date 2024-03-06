const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const TransactionInvite = require("../models/TransactionInvite");
const TransactionInviteStatus = require("../../enum/TransactionInviteStatus");
const Role = require("../models/Role");
const Timeshare = require("../models/Timeshare");
const TransactionStatus = require("../../enum/TransactionStatus");
const RoleEnum = require("../../enum/RoleEnum");
const SellTimeshareStatus = require("../../enum/SellTimeshareStatus");
const moment = require("moment");
const SortTypeEnum = require("../../enum/SortTypeEnum");
const SortByEnum = require("../../enum/SortByEnum");

//@desc search Customer By Name
//@route GET /api/transactions/searchCustomerToInvite
//@access private
const searchCustomerByName = asyncHandler(async (req, res, next) => {
  try {
    const fullName = req.query.fullName;
    if (!fullName || fullName === undefined) {
      res.status(400);
      throw new Error("Không được để trống thông tin yêu cầu");
    }
    const customerRole = await Role.findOne({ roleName: RoleEnum.CUSTOMER });
    User.find(
      {
        fullName: { $regex: fullName, $options: "i" },
        role_id: customerRole.id,
      },
      (err, users) => {
        if (err) {
          // Handle error
          res.status(500);
          throw new Error("Có lỗi xảy ra khi tìm kiếm khách hàng theo tên");
        } else {
          // Send the results as a JSON response to the client
          res.json(users);
        }
      }
    );
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc search Customer By Name
//@route POST /api/transactions/transactionInvite
//@access private
const inviteCustomerJoinTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error(
        "Chỉ có khách hàng có quyền mời khách hàng khác cùng tham gia timeshare"
      );
    }
    const { customer_id, transaction_id } = req.body;
    const customer = await User.findById(customer_id);
    if (!customer) {
      res.status(404);
      throw new Error("Không tìm thấy khách hàng");
    }
    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      res.status(404);
      throw new Error("Không tìm thấy giao dịch");
    }
    if (!transaction.customers.includes(req.user.id)) {
      res.status(400);
      throw new Error(
        "Chỉ những khách hàng đã tham gia timeshare mới có quyền mời khách hàng khác"
      );
    }
    if (transaction.customers.includes(customer_id)) {
      res.status(400);
      throw new Error("Khách hàng đã tham gia timeshare");
    }
    const transaction_invite = new TransactionInvite({
      customer_id,
      transaction_id,
      transaction_invite_status: TransactionInviteStatus.PENDING,
    });
    if (!transaction_invite) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi tạo lời mời");
    }
    const result = await transaction_invite.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi gửi lời mời");
    }
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc search Customer By Name
//@route POST /api/transactions/replyTransactionInvite
//@access private
const replyJoinTimeshareRequest = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error(
        "Chỉ có khách hàng có quyền trả lời yêu cầu tham gia dự án"
      );
    }
    const { transaction_invite_id, transaction_invite_status } = req.body;
    const transaction_invite = await TransactionInvite.findById(
      transaction_invite_id
    ).populate("customer_id");
    if (!transaction_invite) {
      res.status(404);
      throw new Error("Không tìm thấy lời mời tham gia timeshare");
    }
    if (
      transaction_invite.customer_id._id.toString() !== req.user.id.toString()
    ) {
      res.status(403);
      throw new Error("Khách hàng không thể trả lời lời mời của người khác");
    }
    if (
      transaction_invite.transaction_invite_status !==
      TransactionInviteStatus.PENDING
    ) {
      res.status(400);
      throw new Error("Yêu cầu này đã được trả lời");
    }
    switch (transaction_invite_status) {
      case TransactionInviteStatus.ACCEPTED: {
        transaction_invite.transaction_invite_status =
          transaction_invite_status;
        const transaction_invite_result = await transaction_invite.save();
        if (!transaction_invite_result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi trả lời lời mời tham gia timeshare"
          );
        }
        const transaction = await Transaction.findById(
          transaction_invite.transaction_id
        );
        transaction.customers.push(transaction_invite.customer_id);
        const transaction_result = await transaction.save();
        if (!transaction_result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi cập nhật lại khách hàng trong timeshare"
          );
        }
        res.status(200).json(transaction_result);
        break;
      }
      case TransactionInviteStatus.REJECTED: {
        transaction_invite.transaction_invite_status =
          transaction_invite_status;
        const result = await transaction_invite.save();
        if (!result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi trả lời lời mời tham gia timeshare"
          );
        }
        const transaction = await Transaction.findById(
          transaction_invite.transaction_id
        );

        res.status(200).json(transaction);
        break;
      }
      default: {
        res.status(400);
        throw new Error("Trạng thái trả lời không phù hợp");
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Customer by timeshare
//@route POST /api/transactions/buyTimeshare
//@access private
const buyTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error("Chỉ có khách hàng có thể mua timeshare");
    }
    const { timeshare_id, transaction_id, is_reserve } = req.body;
    if (is_reserve === undefined) {
      res.status(400);
      throw new Error("Không được bỏ trống các thành  phần bắt buộc");
    }
    const timeshare = await Timeshare.findById(timeshare_id).populate(
      "investor_id"
    );
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.sell_timeshare_status !== SellTimeshareStatus.CAN_BE_SOLD) {
      res.status(400);
      throw new Error("Trạng thái timeshare không phù hợp để mua!");
    }
    if (is_reserve) {
      const transaction = await Transaction.findById(transaction_id)
        .populate("timeshare_id")
        .exec();
      if (!transaction) {
        res.status(404);
        throw new Error("Không tìm thấy giao dịch giữ chổ");
      }
      if (!transaction.customers.includes(req.user.id)) {
        res.status(403);
        throw new Error(
          "Chỉ có khách hàng đang tham gia timeshare có quyền xác nhận mua timeshare"
        );
      }
      if (transaction.transaction_status === TransactionStatus.WAITING) {
        res.status(400);
        throw new Error("Bạn đã mua timeshare này rồi");
      }
      if (transaction.transaction_status !== TransactionStatus.RESERVING) {
        res.status(400);
        throw new Error(
          "Chỉ có timeshare đang giữ chổ có quyền mua theo cách này"
        );
      }
      transaction.transaction_status = TransactionStatus.WAITING;
      const result = await transaction.save();
      if (!result) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi mua timeshare");
      }
      res.status(200).json(result);
    } else {
      const is_exist_transaction = await Transaction.find({
        timeshare_id,
        customers: req.user.id,
      });
      if (is_exist_transaction.length > 0) {
        is_exist_transaction.forEach((transaction) => {
          if (transaction.transaction_status === TransactionStatus.WAITING) {
            res.status(400);
            throw new Error("Bạn đã mua timeshare này rồi");
          }
        });
      }
      const transaction = new Transaction({
        timeshare_id,
        transaction_status: TransactionStatus.WAITING,
      });
      transaction.customers = new Array();
      transaction.customers.push(req.user.id);
      const result = await transaction.save();
      if (!result) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi mua timeshare");
      }
      res.status(200).json(result);
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Customer by timeshare
//@route Patch /api/transactions
//@access private
const getAllTransactions = asyncHandler(async (req, res) => {
  try {
    const transaction_status = [
      TransactionStatus.WAITING,
      TransactionStatus.SELECTED,
      TransactionStatus.REJECTED,
    ];
    const transactions = await Transaction.find({
      transaction_status: { $in: transaction_status },
    })
      .populate("customers")
      .populate({
        path: "timeshare_id",
        populate: { path: "timeshare_image" },
      })
      .exec();
    if (!transactions) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả đặt cọc");
    }
    const role = req.user.roleName;
    switch (role) {
      case RoleEnum.ADMIN: {
        res.status(200).json(transactions);
        break;
      }
      case RoleEnum.STAFF: {
        res.status(200).json(transactions);
        break;
      }
      case RoleEnum.CUSTOMER: {
        const result = transactions.filter((reservePlace) =>
          reservePlace.customers.find(
            (customer) => customer._id.toString() === req.user.id.toString()
          )
        );
        res.status(200).json(result);
        break;
      }
      case RoleEnum.INVESTOR: {
        const result = transactions.filter(
          (reservePlace) =>
            reservePlace.timeshare_id.investor_id.toString() === req.user.id
        );
        res.status(200).json(result);
        break;
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Customer by timeshare
//@route GET /api/transactions/search
//@access private
const searchTransactionByTimeshareName = asyncHandler(
  async (req, res, next) => {
    try {
      const timeshareName = req.query.timeshareName;
      if (!timeshareName || timeshareName === undefined) {
        res.status(400);
        throw new Error("Tên timeshare không được trống");
      }
      const timeshares = await Timeshare.find({
        timeshare_name: { $regex: timeshareName, $options: "i" },
      });
      if (!timeshares) {
        res.status(400);
        throw new Error("Có lỗi khi tìm kiếm đặt cọc theo tên timeshare");
      } else if (timeshares.length === 0) {
        res.status(200).json(timeshares);
        return;
      }
      const timeshareIds = timeshares.map((timeshare) => timeshare._id);
      const transaction_status = [
        TransactionStatus.WAITING,
        TransactionStatus.SELECTED,
        TransactionStatus.REJECTED,
      ];
      const transactions = await Transaction.find({
        timeshare_id: { $in: timeshareIds },
        transaction_status: { $in: transaction_status },
      })
        .populate("customers")
        .populate({
          path: "timeshare_id",
          populate: { path: "timeshare_image" },
        })
        .exec();
      if (!transactions) {
        res.status(500);
        throw new Error("Có lỗi khi tìm kiếm đặt cọc theo tên timeshare");
      }
      //filter follow roleName
      const role = req.user.roleName;
      switch (role) {
        case RoleEnum.ADMIN: {
          res.status(200).json(transactions);
          break;
        }
        case RoleEnum.STAFF: {
          res.status(200).json(transactions);
          break;
        }
        case RoleEnum.CUSTOMER: {
          const result = transactions.filter((transaction) =>
            transaction.customers.find(
              (customer) => customer._id.toString() === req.user.id.toString()
            )
          );
          res.status(200).json(result);
          break;
        }
        case RoleEnum.INVESTOR: {
          const result = transactions.filter(
            (transaction) =>
              transaction.timeshare_id.investor_id.toString() === req.user.id
          );
          res.status(200).json(result);
          break;
        }
      }
    } catch (error) {
      res
        .status(res.statusCode || 500)
        .send(error.message || "Internal Server Error");
    }
  }
);

//@desc Customer by timeshare
//@route POST /api/transactions/filter
//@access private
const filterTransactionByTimeshare = asyncHandler(async (req, res) => {
  try {
    const filtersArray = req.body;
    const timeshares = await Timeshare.find();
    if (filtersArray.length === 0) {
      res.status(200).json(timeshares);
    } else {
      // Xây dựng query từ filtersArray
      const query = {};

      filtersArray.forEach((filter) => {
        const { key, value } = filter;

        if (key && value) {
          if (key === "year_of_commencement" || key === "year_of_handover") {
            // Xử lý trường hợp đặc biệt cho các trường năm
            const [startYear, endYear] = value.split("-");

            if (startYear && endYear) {
              query[key] = { $gte: startYear, $lte: endYear };
            }
          } else {
            query[key] = value;
          }
        }
      });

      // Thực hiện truy vấn và trả về kết quả
      const timeshares_filter = await Timeshare.find(query);

      const timeshareIds = timeshares_filter.map((timeshare) => timeshare._id);

      const transaction_status = [
        TransactionStatus.WAITING,
        TransactionStatus.SELECTED,
        TransactionStatus.REJECTED,
      ];
      const transactions = await Transaction.find({
        timeshare_id: { $in: timeshareIds },
        transaction_status: { $in: transaction_status },
      })
        .populate("customers")
        .populate({
          path: "timeshare_id",
          populate: { path: "timeshare_image" },
        })
        .exec();
      if (!transactions) {
        res.status(500);
        throw new Error("Có lỗi khi tìm kiếm đặt cọc theo tên timeshare");
      }
      //filter follow roleName
      const role = req.user.roleName;
      switch (role) {
        case RoleEnum.ADMIN: {
          res.status(200).json(transactions);
          break;
        }
        case RoleEnum.STAFF: {
          res.status(200).json(transactions);
          break;
        }
        case RoleEnum.CUSTOMER: {
          const result = transactions.filter((transaction) =>
            transaction.customers.find(
              (customer) => customer._id.toString() === req.user.id.toString()
            )
          );
          res.status(200).json(result);
          break;
        }
        case RoleEnum.INVESTOR: {
          const result = transactions.filter(
            (transaction) =>
              transaction.timeshare_id.investor_id.toString() === req.user.id
          );
          res.status(200).json(result);
          break;
        }
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Customer by timeshare
//@route Patch /api/transactions/confirmSellTimeshare
//@access private
const confirmSellTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư có quyền chọn bán timeshare");
    }
    const { transaction_id, transaction_status } = req.query;
    const chosenTransaction = await Transaction.findById(transaction_id)
      .populate("customers")
      .populate({
        path: "timeshare_id",
        populate: { path: "timeshare_image" },
      })
      .populate({
        path: "timeshare_id",
        populate: { path: "investor_id" },
      })
      .exec();
    if (!chosenTransaction) {
      res.status(404);
      throw new Error("Không tìm thấy giao dịch");
    }
    if (
      chosenTransaction.timeshare_id.investor_id._id.toString() !==
      req.user.id.toString()
    ) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư sở hữu timeshare có quyền chọn bán");
    }
    if (chosenTransaction.transaction_status !== TransactionStatus.WAITING) {
      res.status(400);
      throw new Error("Trạng thái giao dịch không phù hợp để chọn bán");
    }
    if (transaction_status === TransactionStatus.SELECTED) {
      const updatedTransactions = await Transaction.updateMany(
        {
          timeshare_id: chosenTransaction.timeshare_id,
          transaction_status: TransactionStatus.WAITING,
        },
        [
          {
            $set: {
              transaction_status: {
                $cond: {
                  if: { $eq: ["$_id", chosenTransaction._id] },
                  then: TransactionStatus.SELECTED,
                  else: TransactionStatus.REJECTED,
                },
              },
            },
          },
        ]
      );
      if (!updatedTransactions) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi chọn bán timeshare");
      }
      const timeshare = await Timeshare.findById(
        chosenTransaction.timeshare_id._id
      );
      if (!timeshare) {
        res.status(400);
        throw new Error("Có lỗi xảy ra khi cập nhật lại trạng thái timeshare");
      }
      timeshare.sell_timeshare_status = SellTimeshareStatus.SOLD;
      const result = await timeshare.save();
      if (!result) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi cập nhật lại trạng thái timeshare");
      }
      chosenTransaction.transaction_status = TransactionStatus.SELECTED;
      res.status(200).json(chosenTransaction);
    } else if (transaction_status === TransactionStatus.REJECTED) {
      chosenTransaction.transaction_status = transaction_status;
      const updatedTransactions = await chosenTransaction.save();
      if (!updatedTransactions) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi từ chối bán timeshare");
      }
      res.status(200).json(updatedTransactions);
    } else {
      res.status(400);
      throw new Error("Trạng thái giao dịch không phù hợp");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const statisticsTransactionByStatus = asyncHandler(async (req, res) => {
  try {
    const transactions = await Transaction.find();
    if (!transactions || transactions.length === 0) {
      return null;
    }
    const tmpCountData = {
      Reserving: 0,
      Unreserve: 0,
      Waiting: 0,
      Selected: 0,
      Rejected: 0,
    };

    transactions.forEach((timeshare) => {
      const transaction_status = timeshare.transaction_status;
      tmpCountData[transaction_status] = tmpCountData[transaction_status] + 1;
    });

    const result = Object.keys(tmpCountData).map((key) => ({
      key,
      value: tmpCountData[key],
    }));
    res.status(200).json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const sortTransaction = asyncHandler(async (req, res) => {
  const { sortBy, sortType } = req.query;
  try {
    const transaction_status = [
      TransactionStatus.WAITING,
      TransactionStatus.SELECTED,
      TransactionStatus.REJECTED,
    ];
    switch (sortBy) {
      case SortByEnum.CREATED_AT: {
        if (sortType === SortTypeEnum.ASC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status },
          })
            .sort({ createdAt: 1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch theo ngày tạo"
                );
              }
              res.status(200).json(reservePlaces);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status },
          })
            .sort({ createdAt: -1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch theo ngày tạo"
                );
              }
              res.status(200).json(reservePlaces);
            });
        } else {
          res.status(400);
          throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
        }
        break;
      }
      case SortByEnum.TOTAL_MONEY: {
        if (sortType === SortTypeEnum.ASC) {
          let transactions = await Transaction.find({
            transaction_status: { $in: transaction_status },
          })
            .populate("timeshare_id")
            .populate("customers");
          transactions.forEach((transaction) => {
            if (!transaction.reservation_price) {
              transaction.total_money = transaction.timeshare_id.price;
            } else {
              transaction.total_money =
                transaction.timeshare_id.price + transaction.reservation_price;
            }
          });
          transactions.sort((a, b) => a.total_money - b.total_money);
          res.status(200).json(transactions);
        } else if (sortType === SortTypeEnum.DESC) {
          let transactions = await Transaction.find({
            transaction_status: { $in: transaction_status },
          })
            .populate("timeshare_id")
            .populate("customers");
          transactions.forEach((transaction) => {
            if (!transaction.reservation_price) {
              transaction.total_money = transaction.timeshare_id.price;
            } else {
              transaction.total_money =
                transaction.timeshare_id.price + transaction.reservation_price;
            }
          });
          transactions.sort((a, b) => b.total_money - a.total_money);
          res.status(200).json(transactions);
        } else {
          res.status(400);
          throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
        }
        break;
      }
      default: {
        res.status(400);
        throw new Error("Chỉ sort theo tổng tiền và ngày tạo giao dịch");
      }
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  searchCustomerByName,
  inviteCustomerJoinTimeshare,
  replyJoinTimeshareRequest,
  buyTimeshare,
  getAllTransactions,
  searchTransactionByTimeshareName,
  filterTransactionByTimeshare,
  confirmSellTimeshare,
  statisticsTransactionByStatus,
  sortTransaction,
};
