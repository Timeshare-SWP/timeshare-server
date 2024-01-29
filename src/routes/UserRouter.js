const express = require("express");
const bodyParser = require("body-parser");
const userRouter = express.Router();
userRouter.use(bodyParser.json());
const {
  registerUser,
  getUsers,
  getUserById,
  updateUsers,
  deleteUsers,
  searchUserByName,
  currentUser,
  changePassword,
  checkOldPassword,
  forgotPassword,
  resetPassword,
  sendOTPWhenRegister,
  verifyOTPWhenRegister,
} = require("../app/controllers/UserController");
const {
  validateToken,
  validateTokenAdmin,
} = require("../app/middleware/validateTokenHandler");

userRouter.route("/register").post(registerUser);

userRouter.route("/register/staff").post(validateTokenAdmin, registerUser);

userRouter.route("/otpRegister").post(sendOTPWhenRegister);

userRouter.route("/verifyOtpRegister").post(verifyOTPWhenRegister);

userRouter.post("/forgotPassword", forgotPassword);

userRouter.post("/resetPassword", resetPassword);

userRouter.use(validateToken);

//Router for Admin to getAllUsers
userRouter
  .route("/")
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "json/plain");
    next();
  })

  .get(getUsers);

userRouter.get("/search", searchUserByName);

userRouter.get("/current", currentUser);

//Router for getUserByID, updateUser, deleteUser
userRouter
  .route("/:id")
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "json/plain");
    next();
  })

  .get(getUserById)

  .put(updateUsers)

  .delete(deleteUsers);

userRouter.route("/checkOldPassword/:id").post(checkOldPassword);

userRouter.route("/changePassword/:id").put(changePassword);

module.exports = userRouter;
