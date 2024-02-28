const { default: mongoose } = require("mongoose");

const supportSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    support_content: {
      type: String,
      required: true,
    },
    support_type: {
      type: String,
      required: true,
    },
    support_status: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Support", supportSchema);
