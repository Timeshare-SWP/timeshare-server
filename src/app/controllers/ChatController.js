const asyncHandler = require("express-async-handler");
const UserChat = require("../models/UserChat");
const Message = require("../models/Message");

const createUserChats = asyncHandler(async (req, res) => {
  try {
    const userChat = new UserChat(req.body);
    const result = await userChat.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo userChats");
    }
    _io.emit("userChats", await UserChat.find());
    res.status(201).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getAllUserChats = asyncHandler(async (req, res) => {
  try {
    const userChats = await UserChat.find();
    if (!userChats) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả userChats");
    }
    _io.emit("userChats", userChats);
    res.status(200).json(userChats);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const updateUserChatsByIdentifier = asyncHandler(async (req, res) => {
  try {
    const {
      identifierUserChat,
      nameUser,
      avatarUser,
      senderEmail,
      newMsg,
      lastMessages,
    } = req.body;
    const userChat = await UserChat.findOne({ identifierUserChat });
    if (!userChat) {
      res.status(404);
      throw new Error("Không tìm thấy UserChat");
    }
    userChat.nameUser = nameUser;
    userChat.avatarUser = avatarUser;
    userChat.senderEmail = senderEmail;
    userChat.newMsg = newMsg;
    userChat.lastMessages = lastMessages;
    const result = await userChat.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi cập nhật UserChat");
    }
    _io.emit("userChats", await UserChat.find());
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const createMessages = asyncHandler(async (req, res) => {
  try {
    const message = new Message(req.body);
    const result = await message.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo message");
    }
    _io.emit("messages", await Message.find());
    res.status(201).json(message);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find();
    if (!messages) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả messages");
    }
    _io.emit("messages", messages);
    res.status(200).json(messages);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createMessages,
  getAllMessages,
  createUserChats,
  getAllUserChats,
  updateUserChatsByIdentifier,
};
