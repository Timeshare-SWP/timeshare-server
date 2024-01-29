const mongoose = require("mongoose");
const User = require("./User");
const Timeshare = require("./Timeshare");

const transactionSchema = mongoose.Schema(
  {
    timeshare_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Timeshare,
      required: [true],
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: [true],
    },
    transaction_status: {
      type: String,
      required: [true],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
