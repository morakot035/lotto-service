const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true },
    number: { type: String, required: true },
    top: { type: String, default: "" },
    tod: { type: String, default: "" },
    bottom2: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Entry", EntrySchema);
