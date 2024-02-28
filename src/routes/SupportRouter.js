const express = require("express");
const supportRouter = express.Router();
const {
  createSupport,
  getAllSupport,
  changeSupportStatus,
  sortSupport,
  filterSupport,
} = require("../app/controllers/SupportController");

const {
  validateTokenAdmin,
} = require("../app/middleware/validateTokenHandler");

supportRouter
  .route("/")
  .post(createSupport)
  .get(validateTokenAdmin, getAllSupport);

supportRouter.use(validateTokenAdmin);

supportRouter.route("/changeStatus").patch(changeSupportStatus);

supportRouter.route("/sortSupport").get(sortSupport);

supportRouter.route("/filterSupport").get(filterSupport);

module.exports = supportRouter;
