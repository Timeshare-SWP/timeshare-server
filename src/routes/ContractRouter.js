const express = require("express");
const contractRouter = express.Router();
const {
  createContractImage,
  createContract,
  updateContract,
  confirmContract,
  getAllContractStatusByContractId,
  getContractByTransactionId,
  checkTimeshareHaveContract,
  checkAllTransactionHaveContract,
} = require("../app/controllers/ContractController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

contractRouter.use(validateToken);

contractRouter.route("/").post(createContract).put(updateContract);

contractRouter.route("/contractImage").post(createContractImage);

contractRouter.route("/confirmContract").patch(confirmContract);

contractRouter
  .route("/checkTimeshareHaveContract")
  .get(checkTimeshareHaveContract);

contractRouter
  .route("/checkAllTransactionHaveContract")
  .get(checkAllTransactionHaveContract);

contractRouter
  .route("/contractStatus/:contract_id")
  .get(getAllContractStatusByContractId);

contractRouter.route("/:transaction_id").get(getContractByTransactionId);

module.exports = contractRouter;
