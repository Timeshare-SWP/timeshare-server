const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
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
    identifierUserChat: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
