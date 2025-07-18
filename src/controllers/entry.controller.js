const Entry = require("../models/Entry");
const sendError = require("../utils/sendError");

exports.createLottery = async (req, res) => {
  try {
    const { buyerName, number, top, tod, bottom2 } = req.body;

    if (!buyerName || !number) {
      return sendError(res, "กรุณาระบุชื่อผู้ซื้อและเลข");
    }

    const lottery = new Entry({ buyerName, number, top, tod, bottom2 });

    // ให้ lottery มี createdAt ก่อนจะใช้ format ได้
    await lottery.validate(); // เพื่อให้ lottery.createdAt ถูก gen ขึ้น
    lottery.createdAtThai = formatThaiDatetime(new Date()); // หรือ lottery.createdAt หลัง validate

    await lottery.save();

    res.status(201).json({
      message: "บันทึกข้อมูลสำเร็จ",
      data: lottery,
    });
  } catch (err) {
    console.error(err);
    sendError(res, "ไม่สามารถบันทึกข้อมูลหวยได้");
  }
};
function formatThaiDatetime(date) {
  const days = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const d = new Date(date);
  const day = days[d.getDay()];
  const dateNum = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hour = d.getHours().toString().padStart(2, "0");
  const minute = d.getMinutes().toString().padStart(2, "0");

  return `วัน${day}ที่ ${dateNum} ${month} ${year} เวลา ${hour}:${minute} น.`;
}
