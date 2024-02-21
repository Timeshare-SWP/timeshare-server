const express = require("express");
const transactionRouter = express.Router();

const { validateToken } = require("../app/middleware/validateTokenHandler");
const {
  searchCustomerByName,
  inviteCustomerJoinTimeshare,
  replyJoinTimeshareRequest,
  buyTimeshare,
  getAllTransactions,
  searchTransactionByTimeshareName,
  filterTransactionByTimeshare,
  confirmSellTimeshare,
} = require("../app/controllers/TransactionController");

transactionRouter.use(validateToken);

transactionRouter.route("/").get(getAllTransactions);

transactionRouter.route("/searchCustomerToInvite").get(searchCustomerByName);

transactionRouter.route("/transactionInvite").post(inviteCustomerJoinTimeshare);

transactionRouter.route("/buyTimeshare").post(buyTimeshare);

transactionRouter.route("/search").get(searchTransactionByTimeshareName);

transactionRouter.route("/filter").post(filterTransactionByTimeshare);

transactionRouter.route("/confirmSellTimeshare").patch(confirmSellTimeshare);

transactionRouter
  .route("/replyTransactionInvite")
  .post(replyJoinTimeshareRequest);

module.exports = transactionRouter;
