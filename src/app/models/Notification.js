const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notification_content: {
      type: String,
      required: true,
    },
    notification_title: {
      type: String,
      required: true,
    },
    notification_type: {
      type: String,
      required: true,
    },
    related_object: {
      type: String,
    },
    is_read: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
