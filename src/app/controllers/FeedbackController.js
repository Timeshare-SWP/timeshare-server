const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

const createFeedback = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error("Chỉ có khách hàng có quyền đánh giá nhân viên");
    }
    const { customer_id, staff_id, rate } = req.body;
    const customer = await User.findById(customer_id);
    if (!customer) {
      res.status(404);
      throw new Error("Không tìm thấy thông tin khách hàng");
    }
    const staff = await User.findById(staff_id).populate("role_id");
    if (!staff) {
      res.status(404);
      throw new Error("Không tìm thấy thông tin nhân viên");
    }
    if (staff.role_id.roleName !== RoleEnum.STAFF) {
      res.status(400);
      throw new Error("Người được đánh giá không phải là nhân viên");
    }
    const feedback = new Feedback(req.body);
    const result = await feedback.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo feedback mới");
    }

    // update rating for staff
    const totalRatings = staff.ratings.length;
    if (totalRatings === 0) {
      staff.rating = rate;
      staff.ratings = new Array();
      staff.ratings.push(rate);
      await staff.save();
    } else {
      staff.ratings.push(rate);
      const sumOfRatings = staff.ratings.reduce((acc, curr) => acc + curr, 0);
      staff.rating = sumOfRatings / (totalRatings + 1);
      await staff.save();
    }
    res.status(201).json(feedback);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getFeedbacksOfStaff = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.STAFF) {
      res.status(403);
      throw new Error("Chỉ có nhân viên có quyền xem nhận xét của khách hàng");
    }
    const feedbacks = await Feedback.find({ staff_id: req.user.id }).populate(
      "customer_id"
    );
    if (!feedbacks) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả nhận xét");
    }
    res.status(200).json(feedbacks);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getFeedbacksForAdmin = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.ADMIN) {
      res.status(403);
      throw new Error("Chỉ có admin có quyền xem nhận xét của nhân viên");
    }
    const { staff_id } = req.query;
    const feedbacks = await Feedback.find({ staff_id })
      .populate("customer_id")
      .populate("staff_id");
    if (!feedbacks) {
      res.status(500);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả nhận xét của nhân viên"
      );
    }
    res.status(200).json(feedbacks);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const updateFeedback = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error("Chỉ có khách hàng có quyền chỉnh sửa nhận xét");
    }
    const { feedback_id, content, rate } = req.body;
    const feedback = await Feedback.findById(feedback_id);
    if (!feedback) {
      res.status(404);
      throw new Error("Không tìm thấy nhận xét");
    }
    if (feedback.customer_id.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error("Không thể sửa nhận xét của người khác");
    }

    // Update rating of staff
    const staff = await User.findById(feedback.staff_id);
    const index = staff.ratings.indexOf(feedback.rate);
    staff.ratings[index] = rate;
    const sumOfRatings = staff.ratings.reduce((acc, curr) => acc + curr, 0);
    const totalRatings = staff.ratings.length;
    staff.rating = sumOfRatings / totalRatings;
    await staff.save();

    feedback.content = content;
    feedback.rate = rate;
    const result = await feedback.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi cập nhật nhận xét");
    }
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const deleteFeedback = asyncHandler(async (req, res) => {
  try {
    if (
      req.user.roleName !== RoleEnum.CUSTOMER &&
      req.user.roleName !== RoleEnum.ADMIN
    ) {
      res.status(403);
      throw new Error("Người dùng không có quyền xóa nhận xét");
    }
    const { feedback_id } = req.query;
    const feedback = await Feedback.findById(feedback_id);
    if (!feedback) {
      res.status(404);
      throw new Error("Không tìm thấy nhận xét");
    }
    if (
      req.user.roleName === RoleEnum.CUSTOMER &&
      feedback.customer_id.toString() !== req.user.id.toString()
    ) {
      res.status(403);
      throw new Error("Không thể xóa nhận xét của người khác");
    }
    // Update rating of staff
    const staff = await User.findById(feedback.staff_id);
    const index = staff.ratings.indexOf(feedback.rate);
    staff.ratings.splice(index, 1);
    const sumOfRatings = staff.ratings.reduce((acc, curr) => acc + curr, 0);
    const totalRatings = staff.ratings.length;
    staff.rating = sumOfRatings / totalRatings;
    await staff.save();

    await feedback.remove();
    res.status(200).send("Xóa nhận xét thành công");
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createFeedback,
  getFeedbacksForAdmin,
  getFeedbacksOfStaff,
  updateFeedback,
  deleteFeedback,
};
