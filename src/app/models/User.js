const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      maxLength: 255,
      required: [true, "Please add your last name."],
    },
    gender: {
      type: String,
    },
    dob: {
      type: Date,
    },
    address: {
      type: String,
    },
    phone_number: {
      type: String,
      maxLength: 10,
    },
    email: {
      type: String,
      maxLength: 255,
      required: [true, "Please add your email."],
      unique: [true, "Email address has already taken."],
    },
    password: {
      type: String,
    },
    avatar_url: {
      type: String,
    },
    qr_payment: {
      type: String,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true],
    },
    status: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: Number,
    },
    otpExpires: {
      type: Date,
    },
    profit: {
      type: Number,
    },
    ratings: [
      {
        type: Number,
        min: 0,
        max: 5,
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
