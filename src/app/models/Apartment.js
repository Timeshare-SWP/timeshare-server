const mongoose = require("mongoose");

const apartmentSchema = mongoose.Schema(
  {
    timeshare_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timeshare",
      required: true,
    },
    apartment_image: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    apartment_number: {
      type: Number,
      required: true,
    },
    floor_number: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
    number_of_rooms: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    interior: {
      type: String,
      required: true,
    },
    is_selected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Apartment", apartmentSchema);
