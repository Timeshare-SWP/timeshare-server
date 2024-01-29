const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Timeshare = require("../models/Timeshare");
const ReservePlace = require("../models/ReservePlace");
const SellTimeshareStatus = require("../../enum/SellTimeshareStatus");

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
    const reservePlace = new ReservePlace(req.body);
    if (!reservePlace) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi thực hiện đặt cọc");
    }
    reservePlace.customer_id = req.user.id.toString();
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
      }
      const reservePlacesPromises = timeshares.map(async (timeshare) => {
        // For each timeshare, find the related ReservePlace documents
        const reservePlaces = await ReservePlace.find({
          timeshare_id: timeshare._id,
        })
          .populate("customer_id")
          .exec();

        // Add the reservePlaces array to the timeshare document
        return { timeshare, reservePlaces };
      });
      // Use Promise.all to wait for all the promises to resolve
      const results = await Promise.all(reservePlacesPromises);

      // Now, `results` will be an array where each element contains a timeshare and its related reservePlaces
      res.status(200).json(results);
    } catch (error) {
      res
        .status(res.statusCode || 500)
        .send(err.message || "Internal Server Error");
    }
  }
);

module.exports = {
  createReservePlace,
  searchReservePlaceByTimeshareName,
};
