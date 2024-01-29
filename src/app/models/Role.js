const mongoose = require("mongoose");

const roleSchema = mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Please add role name"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
