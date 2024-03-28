const express = require("express");
const {
  createTimeshare,
  getTimesharesForGuest,
  getTimeshareById,
  getTimesharesForInvestor,
  updateTimeshare,
  changeTimeshareStatus,
  changeSellTimeshareStatus,
  searchTimeshareByName,
  deleteTimeshare,
  filterTimeshare,
  createTimeshareImage,
  statisticsTimeshareByStatus,
  statisticsTimeshareBySellTimeshareStatus,
  statisticTimeshareByMonth,
  sortTimeshare,
  statisticsTimeshareBySellStatusForInvestor,
  confirmTimeshare,
} = require("../app/controllers/TimeshareController");
const {
  validateToken,
  validateTokenAdmin,
  validateTokenInvestor,
} = require("../app/middleware/validateTokenHandler");

const timeshareRouter = express.Router();

timeshareRouter.route("/guest").get(getTimesharesForGuest);

timeshareRouter.route("/search").get(searchTimeshareByName);

timeshareRouter.use(validateToken);

timeshareRouter.route("/").post(createTimeshare);

timeshareRouter.route("/timeshare_image").post(createTimeshareImage);

timeshareRouter.route("/investor").get(getTimesharesForInvestor);

timeshareRouter.route("/changeStatus").patch(changeTimeshareStatus);

timeshareRouter.route("/filter").post(filterTimeshare);

timeshareRouter
  .route("/statisticByStatus")
  .get(validateTokenAdmin, statisticsTimeshareByStatus);

timeshareRouter
  .route("/statisticByTimeshareStatus")
  .get(validateTokenAdmin, statisticsTimeshareBySellTimeshareStatus);

timeshareRouter
  .route("/statisticBySellStatusForInvestor")
  .get(validateTokenInvestor, statisticsTimeshareBySellStatusForInvestor);

timeshareRouter
  .route("/changeSellTimeshareStatus")
  .patch(changeSellTimeshareStatus);

timeshareRouter
  .route("/statisticTimeshareByMonth")
  .get(validateTokenAdmin, statisticTimeshareByMonth);

timeshareRouter.route("/sortTimeshare").get(validateTokenAdmin, sortTimeshare);

timeshareRouter
  .route("/confirmTimeshare")
  .patch(validateTokenAdmin, confirmTimeshare);

timeshareRouter
  .route("/:timeshare_id")
  .get(getTimeshareById)
  .put(updateTimeshare)
  .delete(deleteTimeshare);

module.exports = timeshareRouter;
