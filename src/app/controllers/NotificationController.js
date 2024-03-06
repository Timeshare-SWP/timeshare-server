const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Notification = require("../models/Notification");

//@desc Investor create contract
//@route POST /api/notifications
//@access private
const createNotification = asyncHandler(async (req, res) => {
  try {
    const { user_id } = req.body;
    const user = await User.findById(user_id);
    if (!user) {
      res.status(404);
      throw new Error("Không tìm thấy người dùng để gửi thông báo");
    }
    const notification = new Notification(req.body);
    notification.is_read = false;
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route GET /api/notifications/:user_id
//@access private
const viewNotification = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id });
    if (!notifications) {
      res.status(500);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả thông báo của người dùng"
      );
    }
    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route PATCH /api/notifications/readAll
//@access private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id });
    if (!notifications) {
      res.status(500);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả thông báo của người dùng"
      );
    }
    notifications.forEach(async (notification) => {
      if (!notification.is_read) {
        notification.is_read = true;
        await notification.save();
      }
    });
    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route PATCH /api/notifications/read
//@access private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const { notification_id } = req.query;
    const notification = await Notification.findById(notification_id);
    if (notification.user_id.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error("Không thể đọc thông báo của người khác");
    }
    notification.is_read = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createNotification,
  viewNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
