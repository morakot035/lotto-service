const mongoose = require("mongoose");

const amountSchema = new mongoose.Schema(
  {
    total: { type: String, default: "" }, // จำนวนที่ลูกค้าซื้อ
    kept: { type: String, default: "" }, // จำนวนที่เก็บไว้เอง
    sent: { type: String, default: "" }, // จำนวนที่ส่งให้เจ้ามือ
  },
  { _id: false } // ไม่ต้องสร้าง _id ย่อยใน schema นี้
);

const EntrySchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true }, // ชื่อลูกค้า
    number: { type: String, required: true }, // เลขที่ซื้อ เช่น "123", "23"

    // ช่องต่าง ๆ รองรับรูปแบบ amountSchema
    top: amountSchema, // บน
    top2: amountSchema,
    tod: amountSchema, // โต๊ด
    bottom3: amountSchema, // ล่าง 3 ตัว
    bottom2: amountSchema, // ล่าง 2 ตัว

    source: {
      type: String,
      enum: ["self", "dealer"], // แยกต้นทาง: เราเก็บเอง หรือ ส่งเจ้า
      default: "self",
    },

    createdAtThai: { type: String }, // วันเวลาที่แสดงเป็นไทย เช่น "วันจันทร์ที่ 1 มกราคม 2568 เวลา 12:00 น."
  },
  {
    timestamps: true, // สร้าง createdAt / updatedAt อัตโนมัติ
  }
);

module.exports = mongoose.model("Entry", EntrySchema);
