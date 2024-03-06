const express = require("express");
const phaseRouter = express.Router();
const {
  createPhase,
  updatePhase,
  getPhasesByContractId,
  deletePhase,
} = require("../app/controllers/PhaseController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

phaseRouter.use(validateToken);

phaseRouter.route("/").post(createPhase).put(updatePhase);

phaseRouter.route("/:contract_id").get(getPhasesByContractId);

phaseRouter.route("/:phase_id").delete(deletePhase);

module.exports = phaseRouter;
