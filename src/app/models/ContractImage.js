const mongoose = require("mongoose");

const contractImageSchema = mongoose.Schema(
  {
    contract_url: {
      type: String,
      required: true,
    },
    contract_img_description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContractImage", contractImageSchema);
