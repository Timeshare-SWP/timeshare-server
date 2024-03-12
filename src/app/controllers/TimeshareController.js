const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Timeshare = require("../models/Timeshare");
const TimeshareStatus = require("../../enum/TimeshareStatus");
const SellTimeshareStatus = require("../../enum/SellTimeshareStatus");
const Transaction = require("../models/Transaction");
const TimeshareImage = require("../models/TimeshareImage");
const moment = require("moment");
const SortTypeEnum = require("../../enum/SortTypeEnum");
const SortByEnum = require("../../enum/SortByEnum");
const TransactionStatus = require("../../enum/TransactionStatus");

// @desc create new Timeshare
// @route POST /timeshares
// @access Private
const createTimeshareImage = asyncHandler(async (req, res) => {
  try {
    const timeshare_img = new TimeshareImage(req.body);
    await timeshare_img.save();
    res.status(200).json(timeshare_img);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route POST /timeshares
// @access Private
const createTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư mới có quyền tạo timeshare");
    }
    const {
      timeshare_name,
      timeshare_address,
      timeshare_description,
      price,
      max_price,
      timeshare_type,
      timeshare_image,
      land_area,
      deposit_price,
      sell_number,
      year_of_commencement,
      year_of_handover,
    } = req.body;
    if (
      !timeshare_name ||
      !timeshare_address ||
      !timeshare_description ||
      !price ||
      !max_price ||
      !timeshare_type ||
      !timeshare_image ||
      !land_area ||
      !deposit_price ||
      !sell_number ||
      !year_of_commencement ||
      !year_of_handover
    ) {
      res.status(400);
      throw new Error("Không được để trống các thuộc tính bắt buộc");
    }
    if (max_price < price) {
      res.status(400);
      throw new Error("Giá bán tối đa phải lớn hơn giá bán tối thiểu");
    }
    const timeshare = new Timeshare(req.body);
    if (!timeshare) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi tạo timeshare mới");
    }
    timeshare.sell_timeshare_status = SellTimeshareStatus.NOT_YET_SOLD;
    timeshare.investor_id = req.user.id.toString();
    const year_commencement = Number.parseInt(year_of_commencement);
    const year_handover = Number.parseInt(year_of_handover);
    const current_year = new Date().getFullYear();
    if (year_commencement < current_year) {
      res.status(400);
      throw new Error("Năm khởi công phải lớn hơn hoặc bằng năm hiện tại");
    }
    if (year_commencement > year_handover) {
      res.status(400);
      throw new Error("Năm bàn giao phải lớn hơn hoặc bằng năm khởi công");
    }
    const newTimeshare = await timeshare.save();
    res.status(201).json(newTimeshare);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route POST /timeshares/:timeshare_id
// @access Private
const getTimeshareById = asyncHandler(async (req, res) => {
  try {
    const timeshare_id = req.params.timeshare_id;
    const timeshare = await Timeshare.findById(timeshare_id)
      .populate("investor_id")
      .populate("timeshare_image")
      .exec();
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    res.status(200).json(timeshare);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route POST /timeshares/guest
// @access Public
const getTimesharesForGuest = asyncHandler(async (req, res) => {
  try {
    const timeshares = await Timeshare.find()
      .populate("investor_id")
      .populate("timeshare_image")
      .exec();
    if (!timeshares) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả timeshare");
    }
    res.status(200).json(timeshares);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route POST /timeshares/investor
// @access Private
const getTimesharesForInvestor = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư mới được thực hiện chức năng này");
    }
    const timeshares = await Timeshare.find({
      investor_id: req.user.id,
    })
      .populate("investor_id")
      .populate("timeshare_image")
      .exec();
    if (!timeshares) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả timeshare thuộc chủ đầu tư"
      );
    }
    res.status(200).json(timeshares);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route PUT /timeshares/:timeshare_id
// @access Private
const updateTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư có quyền thay đổi thông tin timeshare"
      );
    }
    const {
      timeshare_name,
      timeshare_address,
      timeshare_description,
      price,
      max_price,
      timeshare_type,
      timeshare_image,
      land_area,
      deposit_price,
      sell_number,
      year_of_commencement,
      year_of_handover,
    } = req.body;
    if (
      !timeshare_name ||
      !timeshare_address ||
      !timeshare_description ||
      !price ||
      !max_price ||
      !timeshare_type ||
      !timeshare_image ||
      !land_area ||
      !deposit_price ||
      !sell_number ||
      !year_of_commencement ||
      !year_of_handover
    ) {
      res.status(400);
      throw new Error("Không được để trống các thuộc tính bắt buộc");
    }
    const timeshare_id = req.params.timeshare_id;
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.investor_id.toString() !== req.user.id) {
      res.status(403);
      throw new Error(
        "Chủ đầu tư không thể sửa đổi thông tin timeshare của người khác"
      );
    }
    if (max_price < price) {
      res.status(400);
      throw new Error("Giá bán tối đa phải lớn hơn giá bán tối thiểu");
    }
    const year_commencement = Number.parseInt(year_of_commencement);
    const year_handover = Number.parseInt(year_of_handover);
    const current_year = new Date().getFullYear();
    if (year_commencement < current_year) {
      res.status(400);
      throw new Error("Năm khởi công phải lớn hơn hoặc bằng năm hiện tại");
    }
    if (year_commencement > year_handover) {
      res.status(400);
      throw new Error("Năm bàn giao phải lớn hơn hoặc bằng năm khởi công");
    }
    const updateTimeshare = await Timeshare.findByIdAndUpdate(
      timeshare_id,
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json(updateTimeshare);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route PATCH /timeshares/changeStatus
// @access Privates
const changeTimeshareStatus = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư mới có quyền chỉnh sửa trạng thái timeshare"
      );
    }
    const { timeshare_id, timeshare_status } = req.body;
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.investor_id.toString() !== req.user.id) {
      res.status(403);
      throw new Error(
        "Chủ đầu tư không thể chỉnh sửa trạng thái timeshare của người khác"
      );
    }
    switch (timeshare_status) {
      case TimeshareStatus.TO_IMPLEMENT: {
        res.status(400);
        throw new Error(
          "Trạng thái mặc của timeshare là sắp triển khai. Không thể chuyển về trạng thái này"
        );
      }
      case TimeshareStatus.IN_IMPLEMENT: {
        if (timeshare.timeshare_status !== TimeshareStatus.TO_IMPLEMENT) {
          res.status(400);
          throw new Error(
            "Chỉ có thể chuyển trạng thái sang trong tiến trình khi timeshare sắp triển khai"
          );
        }
        const newTimeshare = await Timeshare.findByIdAndUpdate(
          timeshare_id,
          {
            timeshare_status: timeshare_status,
          },
          { new: true }
        );
        if (!newTimeshare) {
          res.status(400);
          throw new Error("Có lỗi xảy ra khi thay đổi trạng thái timeshare");
        }
        res.status(200).json(newTimeshare);
        break;
      }
      case TimeshareStatus.IMPLEMENTED: {
        if (timeshare.timeshare_status !== TimeshareStatus.IN_IMPLEMENT) {
          res.status(400);
          throw new Error(
            "Chỉ có thể chuyển trạng thái sang đã triển khai khi timeshare đang trong tiến trình"
          );
        }
        const newTimeshare = await Timeshare.findByIdAndUpdate(
          timeshare_id,
          {
            timeshare_status: timeshare_status,
          },
          { new: true }
        );
        if (!newTimeshare) {
          res.status(400);
          throw new Error("Có lỗi xảy ra khi thay đổi trạng thái timeshare");
        }
        res.status(200).json(newTimeshare);
        break;
      }
      default: {
        res.status(400);
        throw new Error("Trạng thái của timeshare không phù hợp");
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc create new Timeshare
// @route PUT /timeshares/changeSellTimeshareStatus
// @access Private
const changeSellTimeshareStatus = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư mới có quyền chỉnh sửa trạng thái timeshare"
      );
    }
    const { timeshare_id, sell_timeshare_status } = req.body;
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.investor_id.toString() !== req.user.id) {
      res.status(403);
      throw new Error(
        "Chủ đầu tư không thể chỉnh sửa trạng thái timeshare của người khác"
      );
    }
    switch (sell_timeshare_status) {
      case SellTimeshareStatus.NOT_YET_SOLD: {
        res.status(400);
        throw new Error(
          "Trạng thái mặc định của timeshare là chưa được bán. Không thể chuyển về trạng thái này"
        );
      }
      case SellTimeshareStatus.CAN_BE_SOLD: {
        if (timeshare.timeshare_status !== TimeshareStatus.IMPLEMENTED) {
          res.status(400);
          throw new Error(
            "Chỉ có thể chuyển sang trạng thái có thể bán khi timeshare đã triển khai"
          );
        }
        const newTimeshare = await Timeshare.findByIdAndUpdate(
          timeshare_id,
          {
            sell_timeshare_status: sell_timeshare_status,
          },
          { new: true }
        );
        if (!newTimeshare) {
          res.status(400);
          throw new Error("Có lỗi xảy ra khi thay đổi trạng thái timeshare");
        }
        res.status(200).json(newTimeshare);
        break;
      }
      case SellTimeshareStatus.SOLD: {
        const newTimeshare = await Timeshare.findByIdAndUpdate(
          timeshare_id,
          {
            sell_timeshare_status: sell_timeshare_status,
          },
          { new: true }
        );
        if (!newTimeshare) {
          res.status(400);
          throw new Error("Có lỗi xảy ra khi thay đổi trạng thái timeshare");
        }
        res.status(200).json(newTimeshare);
        break;
      }
      default: {
        res.status(400);
        throw new Error("Trạng thái bán timeshare không phù hợp");
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Search Timeshare by Name
//@route GET /timeshares/search/:searchName
//@access private
const searchTimeshareByName = asyncHandler(async (req, res, next) => {
  try {
    const searchName = req.query.searchName;
    if (!searchName || searchName === undefined) {
      res.status(400);
      throw new Error("Tên timeshare không được trống");
    }
    const timeshares = await Timeshare.find({
      timeshare_name: { $regex: searchName, $options: "i" },
    })
      .populate("investor_id")
      .populate("timeshare_image")
      .exec();
    if (!timeshares) {
      // Handle error
      res.status(500);
      throw new Error(err.message);
    } else {
      // Send the results as a JSON response to the client
      res.status(200).json(timeshares);
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Search Timeshare by Name
//@route GET /timeshares/:timeshare_id
//@access private
const deleteTimeshare = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư mới có thể xóa timeshare");
    }
    const timeshare_id = req.params.timeshare_id;
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    //the transaction statuses to filter by
    const desiredStatuses = [
      TransactionStatus.RESERVING,
      TransactionStatus.WAITING,
      TransactionStatus.SELECTED,
    ];
    const isHaveTransaction = await Transaction.find({
      timeshare_id,
      transaction_status: { $in: desiredStatuses },
    });
    if (isHaveTransaction.length > 0) {
      res.status(400);
      throw new Error(
        "Timeshare được đặt chổ hoặc đã có giao dịch. Không thể xóa!"
      );
    } else {
      const deleteTimeshare = await Timeshare.findByIdAndDelete(timeshare_id);
      if (!deleteTimeshare) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi xóa timeshare");
      }
      res.status(200).send("Timeshare đã xóa thành công");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Filter Timeshare
//@route GET /timeshares/filter
//@access private
const filterTimeshare = asyncHandler(async (req, res) => {
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
          } else if (key === "price") {
            query[key] = { $lte: value };
            query["max_price"] = { $gte: value };
          } else {
            query[key] = value;
          }
        }
      });

      // Thực hiện truy vấn và trả về kết quả
      const result = await Timeshare.find(query);
      res.json(result);
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const statisticsTimeshareByStatus = asyncHandler(async (req, res) => {
  try {
    const timeshares = await Timeshare.find();
    if (!timeshares || timeshares.length === 0) {
      return null;
    }
    const tmpCountData = {
      "Sắp triển khai": 0,
      "Đang triển khai": 0,
      "Đã triển khai": 0,
    };

    timeshares.forEach((timeshare) => {
      const timeshare_status = timeshare.timeshare_status;
      tmpCountData[timeshare_status] = tmpCountData[timeshare_status] + 1;
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

const statisticsTimeshareBySellTimeshareStatus = asyncHandler(
  async (req, res) => {
    try {
      const timeshares = await Timeshare.find();
      if (!timeshares || timeshares.length === 0) {
        return null;
      }
      const tmpCountData = {
        "Chưa được bán": 0,
        "Đang mở bán": 0,
        "Đã bán": 0,
      };

      timeshares.forEach((timeshare) => {
        const sell_timeshare_status = timeshare.sell_timeshare_status;
        tmpCountData[sell_timeshare_status] =
          tmpCountData[sell_timeshare_status] + 1;
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
  }
);
const statisticsTimeshareBySellStatusForInvestor = asyncHandler(
  async (req, res) => {
    try {
      const timeshares = await Timeshare.find();
      if (!timeshares || timeshares.length === 0) {
        return null;
      }
      const tmpCountData = {
        "Chưa được bán": 0,
        "Đang mở bán": 0,
        "Đã bán": 0,
      };

      timeshares.forEach((timeshare) => {
        if (timeshare.investor_id.toString() === req.user.id.toString()) {
          const sell_timeshare_status = timeshare.sell_timeshare_status;
          tmpCountData[sell_timeshare_status] =
            tmpCountData[sell_timeshare_status] + 1;
        }
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
  }
);

const statisticTimeshareByMonth = asyncHandler(async (req, res) => {
  try {
    const timeshares = await Timeshare.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
    ]);
    if (!timeshares) {
      return null;
    }
    let result = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    timeshares.forEach((timeshare) => {
      const month = timeshare.month;
      result[month - 1] += 1;
    });
    res.status(200).send(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const sortTimeshare = asyncHandler(async (req, res) => {
  const { sortBy, sortType } = req.query;
  try {
    switch (sortBy) {
      case SortByEnum.CREATED_AT: {
        if (sortType === SortTypeEnum.ASC) {
          await Timeshare.find()
            .sort({ createdAt: 1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo ngày tạo"
                );
              }
              res.status(200).json(timeshares);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Timeshare.find()
            .sort({ createdAt: -1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo ngày tạo"
                );
              }
              res.status(200).json(timeshares);
            });
        } else {
          res.status(400);
          throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
        }
        break;
      }
      case SortByEnum.TIMESHARE_NAME: {
        if (sortType === SortTypeEnum.ASC) {
          await Timeshare.find()
            .sort({ timeshare_name: 1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo tên timeshare"
                );
              }
              res.status(200).json(timeshares);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Timeshare.find()
            .sort({ timeshare_name: -1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo tên timeshare"
                );
              }
              res.status(200).json(timeshares);
            });
        } else {
          res.status(400);
          throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
        }
        break;
      }
      case SortByEnum.YEAR_OF_COMMENCEMENT: {
        if (sortType === SortTypeEnum.ASC) {
          await Timeshare.find()
            .sort({ year_of_commencement: 1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo năm bắt đầu"
                );
              }
              res.status(200).json(timeshares);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Timeshare.find()
            .sort({ year_of_commencement: -1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo năm bắt đầu"
                );
              }
              res.status(200).json(timeshares);
            });
        } else {
          res.status(400);
          throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
        }
        break;
      }
      case SortByEnum.YEAR_OF_HANDOVER: {
        if (sortType === SortTypeEnum.ASC) {
          await Timeshare.find()
            .sort({ year_of_handover: 1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo năm bàn giao"
                );
              }
              res.status(200).json(timeshares);
            });
        } else if (sortType === SortTypeEnum.DESC) {
          await Timeshare.find()
            .sort({ year_of_handover: -1 })
            .populate("investor_id")
            .populate("timeshare_image")
            .exec((err, timeshares) => {
              if (err) {
                res.status(500);
                throw new Error(
                  "Có lỗi xảy ra khi truy xuất tất cả timeshare theo năm bàn giao"
                );
              }
              res.status(200).json(timeshares);
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
          "Chỉ sort theo tên, giá, năm bắt đầu, năm bàn giao và ngày tạo timeshare"
        );
      }
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createTimeshare,
  getTimeshareById,
  getTimesharesForGuest,
  getTimesharesForInvestor,
  updateTimeshare,
  changeTimeshareStatus,
  changeSellTimeshareStatus,
  searchTimeshareByName,
  deleteTimeshare,
  filterTimeshare,
  createTimeshareImage,
  statisticsTimeshareByStatus,
  statisticsTimeshareBySellTimeshareStatus,
  statisticsTimeshareBySellStatusForInvestor,
  statisticTimeshareByMonth,
  sortTimeshare,
};
