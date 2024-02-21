const mongoose = require("mongoose");

const timeshareSchema = mongoose.Schema(
  {
    investor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timeshare_name: {
      type: String,
      required: true,
    },
    timeshare_address: {
      type: String,
      required: true,
    },
    timeshare_description: {
      type: String,
      required: true,
    },
    real_estate_code: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    ownership: {
      type: String,
    },
    priority_level: {
      type: String,
      required: true,
    },
    timeshare_scale: {
      type: String,
    },
    timeshare_type: {
      type: String,
      required: true,
    },
    timeshare_utilities: {
      type: [Number],
    },
    timeshare_image: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimeshareImage",
        required: true,
      },
    ],
    land_area: {
      type: String,
      required: true,
    },
    apartment_direction: {
      type: String,
    },
    year_of_commencement: {
      type: String,
    },
    year_of_handover: {
      type: String,
    },
    timeshare_related_link: {
      type: [String],
    },
    timeshare_status: {
      type: String,
      required: true,
    },
    sell_timeshare_status: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timeshare", timeshareSchema);
