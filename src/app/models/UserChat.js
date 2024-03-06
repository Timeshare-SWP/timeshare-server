const mongoose = require("mongoose");

const userChatSchema = mongoose.Schema(
  {
    nameUser: {
      type: String,
      required: true,
    },
    avatarUser: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    newMsg: {
      type: String,
      required: true,
    },
    lastMessages: {
      type: String,
      required: true,
    },
    identifierUserChat: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserChat", userChatSchema);
