const mongoose = require("mongoose");

const blockNumberSchema = new mongoose.Schema({
  number: { type: String, required: true },
});

module.exports = mongoose.model("BlockNumber", blockNumberSchema);
