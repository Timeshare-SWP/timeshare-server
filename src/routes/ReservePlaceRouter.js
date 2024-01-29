const express = require("express");
const reservePlaceRouter = express.Router();
const {
  validateToken,
  validateTokenAdmin,
} = require("../app/middleware/validateTokenHandler");
const {
  createReservePlace,
  searchReservePlaceByTimeshareName,
} = require("../app/controllers/ReservePlaceController");

reservePlaceRouter.use(validateToken);

reservePlaceRouter.route("/").post(createReservePlace);

reservePlaceRouter.route("/search").get(searchReservePlaceByTimeshareName);

module.exports = reservePlaceRouter;
