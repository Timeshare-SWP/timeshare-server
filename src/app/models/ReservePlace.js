const mongoose = require("mongoose");
const Timeshare = require("./Timeshare");
const User = require("./User");

const reservePlaceSchema = mongoose.Schema(
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
    reservation_price: {
      type: Number,
      required: [true],
    },
    is_reservation_paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReservePlace", reservePlaceSchema);
