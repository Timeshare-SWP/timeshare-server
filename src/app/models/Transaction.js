const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    timeshare_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timeshare",
      required: true,
    },
    apartment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: false,
    },
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    transaction_status: {
      type: String,
      required: true,
    },
    reservation_price: {
      type: Number,
    },
    is_reservation_paid: {
      type: Boolean,
    },
    reservation_time: {
      type: Date,
    },
    reservation_pay_date: {
      type: Date,
    },
    note_rejected: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
