const express = require("express");
const authRouter = express.Router();
const {
  login,
  loginGoogle,
  refresh,
  logout,
  isNewGoogleAccount,
} = require("../app/controllers/AuthController");
const loginLimiter = require("../app/middleware/loginLimiter");

authRouter.route("/login").post(loginLimiter, login);

authRouter.route("/isNewGoogleAccount").post(isNewGoogleAccount);

authRouter.route("/loginGoogle").post(loginLimiter, loginGoogle);

authRouter.route("/refresh").get(refresh);

authRouter.route("/logout").post(logout);

module.exports = authRouter;
