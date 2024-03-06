let express = require("express");
let vnPayRouter = express.Router();

const {
  createPaymentUrl,
  VNPayReturn,
} = require("../app/controllers/VNPayController");
const { validateToken } = require("../app/middleware/validateTokenHandler");

vnPayRouter.route("/create_payment_url").post(validateToken, createPaymentUrl);

vnPayRouter.get("/vnpay_return", VNPayReturn);

module.exports = vnPayRouter;
