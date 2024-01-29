const express = require("express");
const {
  createTimeshare,
  getTimesharesForGuest,
  getTimeshareById,
  getTimesharesForInvestor,
  updateTimeshare,
  changeTimeshareStatus,
  changeSellTimeshareStatus,
  searchUserByName,
  searchTimeshareByName,
  deleteTimeshare,
} = require("../app/controllers/TimeshareController");
const { validateToken } = require("../app/middleware/validateTokenHandler");
const timeshareRouter = express.Router();

timeshareRouter.route("/guest").get(getTimesharesForGuest);

timeshareRouter.use(validateToken);

timeshareRouter.route("/").post(createTimeshare);

timeshareRouter.route("/investor").get(getTimesharesForInvestor);

timeshareRouter.route("/changeStatus").patch(changeTimeshareStatus);

timeshareRouter.route("/search").get(searchTimeshareByName);

timeshareRouter
  .route("/changeSellTimeshareStatus")
  .patch(changeSellTimeshareStatus);

timeshareRouter
  .route("/:timeshare_id")
  .get(getTimeshareById)
  .put(updateTimeshare)
  .delete(deleteTimeshare);

module.exports = timeshareRouter;
