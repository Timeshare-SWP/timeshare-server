const mongoose = require("mongoose");

const phaseSchema = mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    phase_no: {
      type: Number,
      required: true,
    },
    phase_price: {
      type: Number,
      required: true,
    },
    phase_price_percent: {
      type: Number,
      required: true,
    },
    pay_date: {
      type: Date,
    },
    is_payment: {
      type: Boolean,
      default: false,
      required: true,
    },
    remittance_deadline: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Phase", phaseSchema);
