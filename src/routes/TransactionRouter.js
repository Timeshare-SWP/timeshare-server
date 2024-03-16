const express = require("express");
const transactionRouter = express.Router();
const {
  validateToken,
  validateTokenAdmin,
  validateTokenInvestor,
} = require("../app/middleware/validateTokenHandler");
const {
  searchCustomerByName,
  inviteCustomerJoinTimeshare,
  replyJoinTimeshareRequest,
  buyTimeshare,
  getAllTransactions,
  searchTransactionByTimeshareName,
  filterTransactionByTimeshare,
  confirmSellTimeshare,
  statisticsTransactionByStatus,
  sortTransaction,
  getWaitingTimeshareOfInvestor,
  getSelectedAndRejectedTimeshareOfInvestor,
  statisticsTransactionForCustomer,
  statisticsSelectedTransactionForCustomer,
  countQuantifyOfBuyer,
} = require("../app/controllers/TransactionController");

transactionRouter
  .route("/countQuantifyOfBuyer/:timeshare_id")
  .get(countQuantifyOfBuyer);

transactionRouter.use(validateToken);

transactionRouter.route("/").get(getAllTransactions);

transactionRouter.route("/searchCustomerToInvite").get(searchCustomerByName);

transactionRouter.route("/transactionInvite").post(inviteCustomerJoinTimeshare);

transactionRouter.route("/buyTimeshare").post(buyTimeshare);

transactionRouter.route("/search").get(searchTransactionByTimeshareName);

transactionRouter.route("/filter").post(filterTransactionByTimeshare);

transactionRouter.route("/confirmSellTimeshare").patch(confirmSellTimeshare);

transactionRouter
  .route("/statisticTransactionByStatus")
  .get(validateTokenAdmin, statisticsTransactionByStatus);

transactionRouter
  .route("/sortTransaction")
  .get(validateTokenAdmin, sortTransaction);

transactionRouter
  .route("/replyTransactionInvite")
  .post(replyJoinTimeshareRequest);

transactionRouter
  .route("/waitingTransaction")
  .get(validateTokenInvestor, getWaitingTimeshareOfInvestor);

transactionRouter
  .route("/selected&RejectedTransaction")
  .get(validateTokenInvestor, getSelectedAndRejectedTimeshareOfInvestor);

transactionRouter
  .route("/statisticTransactionForCustomer")
  .get(statisticsTransactionForCustomer);

transactionRouter
  .route("/statisticSelectedTransactionForCustomer")
  .get(statisticsSelectedTransactionForCustomer);

module.exports = transactionRouter;
