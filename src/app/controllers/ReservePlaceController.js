const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Timeshare = require("../models/Timeshare");
const SellTimeshareStatus = require("../../enum/SellTimeshareStatus");
const Transaction = require("../models/Transaction");
const TransactionStatus = require("../../enum/TransactionStatus");
const { default: mongoose } = require("mongoose");
const SortTypeEnum = require("../../enum/SortTypeEnum");
const SortByEnum = require("../../enum/SortByEnum");

//@desc Create new ReservePlace
//@route POST /reservePlaces
//@access private
const createReservePlace = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(400);
      throw new Error("Chỉ có khách hàng có thể đặt giữ chổ");
    }
    const { timeshare_id, reservation_price } = req.body;
    if (!timeshare_id || !reservation_price) {
      res.status(400);
      throw new Error("Không được để trống các thuộc tính bắt buộc");
    }
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.sell_timeshare_status !== SellTimeshareStatus.NOT_YET_SOLD) {
      res.status(400);
      throw new Error("Chỉ timeshare chưa được bán mới có thể đặt cọc");
    }
    const reservePlace = new Transaction(req.body);
    if (!reservePlace) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi thực hiện đặt cọc");
    }
    reservePlace.customers = new Array();
    reservePlace.customers.push(req.user.id);
    reservePlace.transaction_status = TransactionStatus.RESERVING;
    reservePlace.is_reservation_paid = false;
    reservePlace.reservation_time = new Date();
    const newReservePlace = await reservePlace.save();
    if (!reservePlace) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi thực hiện đặt cọc");
    }
    res.status(201).json(newReservePlace);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Create new ReservePlace
//@route POST /reservePlaces/search/:timeshareName
//@access private
const searchReservePlaceByTimeshareName = asyncHandler(
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
      const transaction_status_reserve = [
        TransactionStatus.RESERVING,
        TransactionStatus.UNRESERVE,
      ];
      const reservePlaces = await Transaction.find({
        timeshare_id: { $in: timeshareIds },
        transaction_status: { $in: transaction_status_reserve },
      });
      if (!reservePlaces) {
        res.status(500);
        throw new Error("Có lỗi khi tìm kiếm đặt cọc theo tên timeshare");
      }
      //filter follow roleName
      const role = req.user.roleName;
      switch (role) {
        case RoleEnum.ADMIN: {
          res.status(200).json(reservePlaces);
          break;
        }
        case RoleEnum.STAFF: {
          res.status(200).json(reservePlaces);
          break;
        }
        case RoleEnum.CUSTOMER: {
          const result = reservePlaces.filter((reservePlace) =>
            reservePlace.customers.find(
              (customer) => customer._id.toString() === req.user.id.toString()
            )
          );
          res.status(200).json(result);
          break;
        }
        case RoleEnum.INVESTOR: {
          const result = reservePlaces.filter(
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
        .send(err.message || "Internal Server Error");
    }
  }
);

//@desc Filter Timeshare
//@route GET /reservePlaces/filter
//@access private
const filterReservePlaceByTimeshare = asyncHandler(async (req, res) => {
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

      const transaction_status_reserve = [
        TransactionStatus.RESERVING,
        TransactionStatus.UNRESERVE,
      ];
      const reservePlaces = await Transaction.find({
        timeshare_id: { $in: timeshareIds },
        transaction_status: { $in: transaction_status_reserve },
      });
      if (!reservePlaces) {
        res.status(500);
        throw new Error("Có lỗi khi tìm kiếm đặt cọc theo tên timeshare");
      }
      //filter follow roleName
      const role = req.user.roleName;
      switch (role) {
        case RoleEnum.ADMIN: {
          res.status(200).json(reservePlaces);
          break;
        }
        case RoleEnum.STAFF: {
          res.status(200).json(reservePlaces);
          break;
        }
        case RoleEnum.CUSTOMER: {
          const result = reservePlaces.filter((reservePlace) =>
            reservePlace.customers.find(
              (customer) => customer._id.toString() === req.user.id.toString()
            )
          );
          res.status(200).json(result);
          break;
        }
        case RoleEnum.INVESTOR: {
          const result = reservePlaces.filter(
            (reservePlace) =>
              reservePlace.timeshare_id.investor_id.toString() === req.user.id
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

//@desc Filter Timeshare
//@route GET /reservePlaces
//@access private
const getAllReservePlaces = asyncHandler(async (req, res) => {
  try {
    const transaction_status_reserve = [
      TransactionStatus.RESERVING,
      TransactionStatus.UNRESERVE,
    ];
    const reservePlaces = await Transaction.find({
      transaction_status: { $in: transaction_status_reserve },
    })
      .populate("customers")
      .populate({
        path: "timeshare_id",
        populate: { path: "timeshare_image" },
      })
      .exec();
    if (!reservePlaces) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả đặt cọc");
    }
    const role = req.user.roleName;
    switch (role) {
      case RoleEnum.ADMIN: {
        res.status(200).json(reservePlaces);
        break;
      }
      case RoleEnum.STAFF: {
        res.status(200).json(reservePlaces);
        break;
      }
      case RoleEnum.CUSTOMER: {
        const result = reservePlaces.filter((reservePlace) =>
          reservePlace.customers.find(
            (customer) => customer._id.toString() === req.user.id.toString()
          )
        );
        res.status(200).json(result);
        break;
      }
      case RoleEnum.INVESTOR: {
        const result = reservePlaces.filter(
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

//@desc Filter Timeshare
//@route GET /reservePlaces/whoReservePlace/:timeshare_id
//@access private
const getAllCustomerWhoReservePlace = asyncHandler(async (req, res) => {
  try {
    const transaction_status_reserve = [
      TransactionStatus.RESERVING,
      TransactionStatus.UNRESERVE,
    ];
    const { timeshare_id } = req.params;
    const reservePlaces = await Transaction.find({
      timeshare_id,
      transaction_status: { $in: transaction_status_reserve },
    }).populate("customers");
    if (!reservePlaces) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả khách hàng đã đặt cọc timeshare"
      );
    }
    res.status(200).json(reservePlaces);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Filter Timeshare
//@route GET /reservePlaces/cancel
//@access private
const cancelReservePlace = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== "Customer") {
      res.status(403);
      throw new Error("Chỉ có khách hàng có thể hủy đặt cọc");
    }
    const { transaction_id } = req.query;
    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      res.status(404);
      throw new Error("Không tìm thấy đặt cọc");
    }
    if (transaction.transaction_status !== TransactionStatus.RESERVING) {
      res.status(400);
      throw new Error("Trạng thái của đặt cọc không phù hợp để hủy");
    }
    if (!transaction.customers.includes(req.user.id)) {
      res.status(403);
      throw new Error(
        "Chỉ có khách hàng đang tham gia timeshare mới có quyền hủy đặt cọc"
      );
    }
    transaction.transaction_status = TransactionStatus.UNRESERVE;
    const result = await transaction.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi hủy đặt cọc");
    }
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const sortReservePlace = asyncHandler(async (req, res) => {
  const { sortBy, sortType } = req.query;
  try {
    const transaction_status_reserve = [
      TransactionStatus.RESERVING,
      TransactionStatus.UNRESERVE,
    ];
    switch (sortBy) {
      case SortByEnum.CREATED_AT: {
        if (sortType === SortTypeEnum.ASC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ createdAt: 1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo ngày tạo"
                );
              }
              res.status(200).json(reservePlaces);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ createdAt: -1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo ngày tạo"
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
      case SortByEnum.RESERVATION_PRICE: {
        if (sortType === SortTypeEnum.ASC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ reservation_price: 1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo tiền giữ chổ"
                );
              }
              res.status(200).json(reservePlaces);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ reservation_price: -1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo tiền giữ chổ"
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
      case SortByEnum.RESERVATION_TIME: {
        if (sortType === SortTypeEnum.ASC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ reservation_time: 1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo ngày giữ chổ"
                );
              }
              res.status(200).json(reservePlaces);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Transaction.find({
            transaction_status: { $in: transaction_status_reserve },
          })
            .sort({ reservation_time: -1 })
            .populate("timeshare_id")
            .populate("customers")
            .exec((err, reservePlaces) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả giao dịch giữ chổ theo ngày giữ chổ"
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
      default: {
        res.status(400);
        throw new Error(
          "Chỉ sort theo tiền giữ chổ, ngày giữ chổ và ngày tạo giao dịch giữ chổ"
        );
      }
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const checkReservingTimeshare = asyncHandler(async (req, res) => {
  try {
    const { timeshare_id } = req.query;
    const transactions = await Transaction.find({
      timeshare_id,
      customers: req.user.id,
    });
    if (!transactions || transactions.length === 0) {
      res.status(200).send(false);
      return;
    }
    transactions.forEach((transaction) => {
      if (transaction.transaction_status === TransactionStatus.RESERVING) {
        res.status(200).send(true);
        return;
      }
    });
    res.status(200).send(false);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createReservePlace,
  searchReservePlaceByTimeshareName,
  filterReservePlaceByTimeshare,
  getAllReservePlaces,
  getAllCustomerWhoReservePlace,
  cancelReservePlace,
  sortReservePlace,
  checkReservingTimeshare,
};
