const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Timeshare = require("../models/Timeshare");
const TimeshareStatus = require("../../enum/TimeshareStatus");
const SellTimeshareStatus = require("../../enum/SellTimeshareStatus");
const { default: mongoose } = require("mongoose");
const ReservePlace = require("../models/ReservePlace");
const Transaction = require("../models/Transaction");

// @desc create new Timeshare
// @route POST /timeshares
// @access Private
const createTimeshare = asyncHandler(async (req, res) => {
  if (req.user.roleName !== RoleEnum.INVESTOR) {
    res.status(403);
    throw new Error("Chỉ có chủ đầu tư mới có quyền tạo timeshare");
  }
  const {
    timeshare_name,
    timeshare_address,
    timeshare_description,
    price,
    timeshare_type,
    timeshare_image,
    land_area,
  } = req.body;
  if (
    !timeshare_name ||
    !timeshare_address ||
    !timeshare_description ||
    !price ||
    !timeshare_type ||
    !timeshare_image ||
    !land_area
  ) {
    res.status(400);
    throw new Error("Không được để trống các thuộc tính bắt buộc");
  }
  const timeshare = new Timeshare(req.body);
  if (!timeshare) {
    res.status(400);
    throw new Error("Có lỗi xảy ra khi tạo timeshare mới");
  }
  timeshare.timeshare_status = TimeshareStatus.TO_IMPLEMENT;
  timeshare.sell_timeshare_status = SellTimeshareStatus.NOT_YET_SOLD;
  timeshare.investor_id = req.user.id.toString();
  const year_of_commencement = Number.parseInt(req.body.year_of_commencement);
  const year_of_handover = Number.parseInt(req.body.year_of_handover);
  const current_year = new Date().getFullYear();
  if (year_of_commencement < current_year) {
    res.status(400);
    throw new Error("Năm khởi công phải lớn hơn hoặc bằng năm hiện tại");
  }
  if (year_of_commencement > year_of_handover) {
    res.status(400);
    throw new Error("Năm bàn giao phải lớn hơn hoặc bằng năm khởi công");
  }
  try {
    const newTimeshare = await timeshare.save();
    res.status(201).json(newTimeshare);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    const { year_of_commencement, year_of_handover } = req.body;
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
    console.log(searchName);
    if (!searchName || searchName === undefined) {
      res.status(400);
      throw new Error("Tên timeshare không được trống");
    }
    Timeshare.find(
      { timeshare_name: { $regex: searchName, $options: "i" } },
      (err, timeshares) => {
        if (err) {
          // Handle error
          res.status(500);
          throw new Error(err.message);
        } else {
          // Send the results as a JSON response to the client
          res.status(200).json(timeshares);
        }
      }
    );
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
    const isHaveReservePlace = await ReservePlace.findOne({ timeshare_id });
    const isHaveTransaction = await Transaction.findOne({ timeshare_id });
    if (isHaveReservePlace || isHaveTransaction) {
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
};
