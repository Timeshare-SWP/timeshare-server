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
  searchCustomerByName,
  currentUser,
  changePassword,
  checkOldPassword,
  forgotPassword,
  resetPassword,
  sendOTPWhenRegister,
  verifyOTPWhenRegister,
  getInvestors,
  getStaffs,
  sortAccountByCreatedAt,
  statisticsAccountByStatus,
  searchAccountByEmail,
  banAccountByAdmin,
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

userRouter.get("/investors", getInvestors);

userRouter.get("/staffs", getStaffs);

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

userRouter.get("/current", currentUser);

userRouter.route("/sortByCreatedAt").get(sortAccountByCreatedAt);

userRouter
  .route("/statisticsAccount")
  .get(validateTokenAdmin, statisticsAccountByStatus);

userRouter
  .route("/searchAccountByEmail")
  .get(validateTokenAdmin, searchAccountByEmail);

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

userRouter
  .route("/banAccountByAdmin/:account_id")
  .patch(validateTokenAdmin, banAccountByAdmin);

module.exports = userRouter;
