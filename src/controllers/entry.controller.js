const Entry = require("../models/Entry");
const CutConfig = require("../models/CutConfig");
const sendError = require("../utils/sendError");

exports.createLottery = async (req, res) => {
  try {
    const { buyerName, number, top, tod, bottom } = req.body;

    if (!buyerName || !number) {
      return sendError(res, "กรุณาระบุชื่อผู้ซื้อและเลข");
    }

    const numLength = number.trim().length;
    const topAmount = parseFloat(top || "0");
    const todAmount = parseFloat(tod || "0");
    const bottomAmount = parseFloat(bottom || "0");

    // ✅ ดึง config ล่าสุด
    const latestConfig = await CutConfig.findOne().sort({ createdAt: -1 });
    const limitTop =
      numLength === 3
        ? parseFloat(latestConfig?.threeDigitTop || "0")
        : parseFloat(latestConfig?.twoDigitTop || "0");

    const limitTod =
      numLength === 3 ? parseFloat(latestConfig?.threeDigitTod || "0") : 0;

    const limitBottom =
      numLength === 3
        ? parseFloat(latestConfig?.threeDigitBottom || "0")
        : parseFloat(latestConfig?.twoDigitBottom || "0");

    const calcKeepSent = (amount, limit) => {
      const kept = Math.min(amount, limit);
      const sent = Math.max(amount - limit, 0);
      return {
        total: amount.toString(),
        kept: kept.toString(),
        sent: sent.toString(),
      };
    };

    const entryFields = {
      buyerName,
      number,
      source: "self",
    };

    if (topAmount > 0) {
      entryFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
        topAmount,
        limitTop
      );
    }

    if (todAmount > 0 && numLength === 3) {
      entryFields["tod"] = calcKeepSent(todAmount, limitTod);
    }

    if (bottomAmount > 0) {
      entryFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
        bottomAmount,
        limitBottom
      );
    }

    const selfEntry = new Entry({
      ...entryFields,
      createdAtThai: formatThaiDatetime(new Date()),
    });
    await selfEntry.save();

    // ตรวจสอบว่าส่งเจ้ามือหรือไม่
    const dealerFields = {
      buyerName,
      number,
      source: "dealer",
    };

    const hasDealer = [];

    if (topAmount > limitTop) {
      dealerFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
        topAmount,
        limitTop
      );
      hasDealer.push(true);
    }
    if (todAmount > limitTod && numLength === 3) {
      dealerFields["tod"] = calcKeepSent(todAmount, limitTod);
      hasDealer.push(true);
    }
    if (bottomAmount > limitBottom) {
      dealerFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
        bottomAmount,
        limitBottom
      );
      hasDealer.push(true);
    }

    let dealerEntry = null;
    if (hasDealer.length > 0) {
      dealerEntry = new Entry({
        ...dealerFields,
        createdAtThai: formatThaiDatetime(new Date()),
      });
      await dealerEntry.save();
    }

    res.status(201).json({
      message: "บันทึกข้อมูลสำเร็จ",
      data: {
        self: selfEntry,
        dealer: dealerEntry,
      },
      createdAtThai: selfEntry.createdAtThai,
    });
  } catch (err) {
    console.error(err);
    sendError(res, "ไม่สามารถบันทึกข้อมูลหวยได้");
  }
};

function formatThaiDatetime(date) {
  const d = new Date(date);
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
  const day = days[d.getDay()];
  const dateNum = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hour = d.getHours().toString().padStart(2, "0");
  const minute = d.getMinutes().toString().padStart(2, "0");
  return `วัน${day}ที่ ${dateNum} ${month} ${year} เวลา ${hour}:${minute} น.`;
}
