const express = require("express");
const reservePlaceRouter = express.Router();
const {
  validateToken,
  validateTokenInvestor,
} = require("../app/middleware/validateTokenHandler");
const {
  createReservePlace,
  searchReservePlaceByTimeshareName,
  filterReservePlaceByTimeshare,
  getAllReservePlaces,
  getAllCustomerWhoReservePlace,
  cancelReservePlace,
} = require("../app/controllers/ReservePlaceController");

reservePlaceRouter.use(validateToken);

reservePlaceRouter.route("/").get(getAllReservePlaces).post(createReservePlace);

reservePlaceRouter.route("/search").get(searchReservePlaceByTimeshareName);

reservePlaceRouter.route("/filter").post(filterReservePlaceByTimeshare);

reservePlaceRouter.route("/cancel").delete(cancelReservePlace);

reservePlaceRouter
  .route("/whoReservePlace/:timeshare_id")
  .get(getAllCustomerWhoReservePlace);

module.exports = reservePlaceRouter;
