const express = require("express");
const chatRouter = express.Router();
const {
  createMessages,
  getAllMessages,
  createUserChats,
  getAllUserChats,
  updateUserChatsByIdentifier,
} = require("../app/controllers/ChatController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

chatRouter.use(validateToken);

chatRouter
  .route("/userChats")
  .post(createUserChats)
  .get(getAllUserChats)
  .put(updateUserChatsByIdentifier);

chatRouter.route("/messages").post(createMessages).get(getAllMessages);

module.exports = chatRouter;
