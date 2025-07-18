const mongoose = require("mongoose");

const CutConfigSchema = new mongoose.Schema(
  {
    threeDigitTop: { type: String, default: "" }, // 3 ตัวเต็ง
    threeDigitTod: { type: String, default: "" }, // 3 ตัวโต๊ด
    threeDigitBottom: { type: String, default: "" }, // 3 ตัวล่าง
    twoDigitTop: { type: String, default: "" }, // 2 ตัวบน
    twoDigitBottom: { type: String, default: "" }, // 2 ตัวล่าง
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CutConfig", CutConfigSchema);
