const express = require("express");
const phaseRouter = express.Router();
const {
  createPhase,
  updatePhase,
} = require("../app/controllers/PhaseController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

phaseRouter.use(validateToken);

phaseRouter.route("/").post(createPhase).put(updatePhase);

module.exports = phaseRouter;
