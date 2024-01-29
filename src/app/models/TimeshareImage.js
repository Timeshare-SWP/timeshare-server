const mongoose = require("mongoose");
const User = require("./User");

const timeshareImageSchema = mongoose.Schema(
  {
    timeshare_img_type: {
      type: String,
      required: [true],
    },
    timeshare_img_url: {
      type: String,
      required: [true],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimeshareImage", timeshareImageSchema);
