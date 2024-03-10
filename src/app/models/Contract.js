const mongoose = require("mongoose");

const contractSchema = mongoose.Schema(
  {
    transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    final_price: {
      type: Number,
    },
    is_all_confirm: {
      type: Boolean,
      default: false,
      required: true,
    },
    contract_image: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContractImage",
        required: true,
      },
    ],
    contract_related_link: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", contractSchema);
