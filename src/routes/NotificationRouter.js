const express = require("express");
const notificationRouter = express.Router();
const {
  createNotification,
  viewNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require("../app/controllers/NotificationController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

notificationRouter.use(validateToken);

notificationRouter.route("/").post(createNotification).get(viewNotification);

notificationRouter.route("/readAll").patch(markAllNotificationsAsRead);

notificationRouter.route("/read").patch(markNotificationAsRead);

module.exports = notificationRouter;
