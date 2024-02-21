const express = require("express");
const contractRouter = express.Router();
const {
  createContractImage,
  createContract,
  updateContract,
  confirmContract,
} = require("../app/controllers/ContractController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

contractRouter.use(validateToken);

contractRouter.route("/").post(createContract).put(updateContract);

contractRouter.route("/contractImage").post(createContractImage);

contractRouter.route("/confirmContract").patch(confirmContract);

module.exports = contractRouter;
