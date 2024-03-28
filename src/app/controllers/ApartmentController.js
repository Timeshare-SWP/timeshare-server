const asyncHandler = require("express-async-handler");
const Timeshare = require("../models/Timeshare");
const Apartment = require("../models/Apartment");
const TimeshareType = require("../../enum/TimeshareType");
const ConfirmStatus = require("../../enum/ConfirmStatus");

const createApartment = asyncHandler(async (req, res) => {
  try {
    const {
      timeshare_id,
      apartment_image,
      area,
      apartment_number,
      floor_number,
      note,
      number_of_rooms,
      condition,
      interior,
    } = req.body;
    if (
      !timeshare_id ||
      !apartment_image ||
      !area ||
      !apartment_number ||
      !floor_number ||
      !note ||
      !number_of_rooms ||
      !condition ||
      !interior
    ) {
      res.status(400);
      throw new Error("Không thể để trống các thuộc tính bắt buộc");
    }
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(400);
      throw new Error("Không tìm thấy timeshare");
    }
    if (timeshare.investor_id.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư sở hữu timeshare có quyền tạo căn hộ");
    }
    if (timeshare.timeshare_type !== TimeshareType.CONDOMINIUM) {
      res.status(400);
      throw new Error("Chỉ có timeshare là chung cư được quyền tạo");
    }
    const apartment = await Apartment.create(req.body);
    if (!apartment) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo căn hộ mới");
    }
    res.status(201).json(apartment);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getApartmentById = asyncHandler(async (req, res) => {
  try {
    const { apartment_id } = req.params;
    const apartment = await Apartment.findById(apartment_id)
      .populate({
        path: "timeshare_id",
        populate: { path: "timeshare_image" },
      })
      .populate({
        path: "timeshare_id",
        populate: { path: "investor_id" },
      })
      .exec();
    if (!apartment) {
      res.status(404);
      throw new Error("Không tìm thấy căn hộ");
    }
    res.status(200).json(apartment);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getAllApartmentOfTimeshare = asyncHandler(async (req, res) => {
  try {
    const { timeshare_id } = req.params;
    const timeshare = await Timeshare.findById(timeshare_id);
    if (!timeshare) {
      res.status(404);
      throw new Error("Không tìm thấy timeshare");
    }
    const apartments = await Apartment.find({
      timeshare_id,
    })
      .populate({
        path: "timeshare_id",
        populate: { path: "timeshare_image" },
      })
      .populate({
        path: "timeshare_id",
        populate: { path: "investor_id" },
      })
      .exec();
    if (!apartments) {
      res.status(500);
      throw new Error(
        `Có lỗi xảy ra khi truy xuất tất cả căn hộ của timeshare ${timeshare.timeshare_name}`
      );
    }
    res.status(200).json(apartments);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const updateApartment = asyncHandler(async (req, res) => {
  try {
    const {
      apartment_id,
      apartment_image,
      area,
      apartment_number,
      floor_number,
      note,
      number_of_rooms,
      condition,
      interior,
    } = req.body;
    const apartment = await Apartment.findById(apartment_id).populate(
      "timeshare_id"
    );
    if (!apartment) {
      res.status(404);
      throw new Error("Không tìm thấy căn hộ");
    }
    if (
      apartment.timeshare_id.investor_id.toString() !== req.user.id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền chỉnh sửa thông tin căn hộ"
      );
    }
    apartment.apartment_image = apartment_image ?? apartment.apartment_image;
    apartment.area = area ?? apartment.area;
    apartment.apartment_number = apartment_number ?? apartment.apartment_number;
    apartment.floor_number = floor_number ?? apartment.floor_number;
    apartment.note = note ?? apartment.note;
    apartment.number_of_rooms = number_of_rooms ?? apartment.number_of_rooms;
    apartment.condition = condition ?? apartment.condition;
    apartment.interior = interior ?? apartment.interior;
    const result = await apartment.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi cập nhật thông tin căn hộ");
    }
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const deleteApartment = asyncHandler(async (req, res) => {
  try {
    const { apartment_id } = req.params;
    const apartment = await Apartment.findById(apartment_id).populate(
      "timeshare_id"
    );
    if (!apartment) {
      res.status(404);
      throw new Error("Không tìm thấy căn hộ");
    }
    if (
      apartment.timeshare_id.investor_id.toString() !== req.user.id.toString()
    ) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư sở hữu timeshare có quyền xóa căn hộ");
    }
    const result = await apartment.remove();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi xóa căn hộ");
    }
    res.status(200).send("Xóa căn hộ thành công");
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createApartment,
  getAllApartmentOfTimeshare,
  getApartmentById,
  updateApartment,
  deleteApartment,
};
