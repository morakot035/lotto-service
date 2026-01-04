import express from "express";
import axios from "axios";
import dayjs from "dayjs";
import Entry from "../models/Entry.js";
import Holidays from "date-holidays";

const hd = new Holidays("TH");

// เลื่อนวันออกผลไปวันถัดไป ถ้าวันนั้นเป็นวันหยุด
function shiftIfHoliday(d) {
  let x = dayjs(d);
  // date-holidays ใช้ Date object
  while (hd.isHoliday(x.toDate())) {
    x = x.add(1, "day");
  }
  return x;
}

// คืนค่า { date, month, year } ของ “งวดล่าสุด” ณ เวลานั้น
export function getLatestDrawDate(now = dayjs()) {
  // งวดของเดือนนี้ (1 และ 16) + เลื่อนถ้าตรงวันหยุด
  const firstBase = now.date(1);
  const sixteenthBase = now.date(16);

  const firstDraw = shiftIfHoliday(firstBase);
  const sixteenthDraw = shiftIfHoliday(sixteenthBase);

  // ถ้ายังไม่ถึงงวดแรกของเดือนนี้ → ใช้งวดก่อน (เดือนก่อนวันที่ 16)
  if (now.isBefore(firstDraw, "day") || now.isBefore(firstDraw)) {
    const prevMonth = now.subtract(1, "month");
    const prevSixteenth = shiftIfHoliday(prevMonth.date(16));
    return {
      date: prevSixteenth.format("DD"),
      month: prevSixteenth.format("MM"),
      year: prevSixteenth.format("YYYY"),
    };
  }

  // ถ้าถึงงวดแรกแล้ว แต่ยังไม่ถึงงวด 16 → ใช้งวดแรก
  if (now.isBefore(sixteenthDraw, "day") || now.isBefore(sixteenthDraw)) {
    return {
      date: firstDraw.format("DD"),
      month: firstDraw.format("MM"),
      year: firstDraw.format("YYYY"),
    };
  }

  // ถ้าถึงงวด 16 แล้ว → ใช้งวด 16
  return {
    date: sixteenthDraw.format("DD"),
    month: sixteenthDraw.format("MM"),
    year: sixteenthDraw.format("YYYY"),
  };
}

const router = express.Router();

router.post("/result", async (req, res) => {
  try {
    // ✅ หาวันที่งวดล่าสุด (1 หรือ 16)
    const now = dayjs();
    const day = now.date();

    const date = day >= 16 ? "16" : "01";
    const month = now.format("MM");
    const year = now.format("YYYY");
    // const { date, month, year } = getLatestDrawDate(dayjs());

    // ✅ เรียก API GLO
    const response = await axios.post(
      "https://www.glo.or.th/api/checking/getLotteryResult",
      { date, month, year },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ ตรวจสอบผล
    if (response.data?.status === true) {
      const first = response.data.response.result.data.first.number[0].value;
      const last2 = response.data.response.result.data.last2.number[0].value;
      const last3f = response.data.response.result.data.last3f.number;
      const last3b = response.data.response.result.data.last3b.number;
      res.status(200).json({
        success: true,
        date: { date, month, year },
        data: {
          firstPrize: first,
          lastTwoDigits: last2,
          threeDigitFront: last3f,
          threeDigitBack: last3b,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลผลสลากกินแบ่ง",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "สำนักงานสลากกินแบ่งรัฐบาล กำลังจะออกรางวัลเร็วๆนี้\n โปรดรอสักครู่...",
    });
  }
});

router.post("/check-winners", async (req, res) => {
  try {
    const now = dayjs();
    const day = now.date();
    const date = day >= 16 ? "16" : "01";
    const month = now.format("MM");
    const year = now.format("YYYY");
    // const { date, month, year } = getLatestDrawDate(dayjs());

    const { number } = req.body;
    if (!number) {
      return res
        .status(400)
        .json({ success: false, message: "กรุณาระบุเลขที่ต้องการค้นหา" });
    }

    // ดึงผลรางวัลจาก GLO
    const response = await axios.post(
      "https://www.glo.or.th/api/checking/getLotteryResult",
      { date, month, year }
    );

    const data = response.data.response.result.data;
    const firstPrize = data.first.number[0].value;
    const lastTwoDigits = data.last2.number[0].value;
    const threeDigitFront = data.last3f.number.map((n) => n.value);
    const threeDigitBack = data.last3b.number.map((n) => n.value);

    const top3Digits = firstPrize.slice(-3); // เช่น 123852 → 852
    const todVariants = getTodVariants(top3Digits); // ["852", "258", "285", ...]

    // ค้นหาเลขเฉพาะที่อยู่ในฝั่ง self
    const entries = await Entry.find({ number, source: "self" });
    const checktod = await Entry.find({
      number: { $in: todVariants },
      source: "self",
    });

    const winners = [];

    for (const entry of entries) {
      const { buyerName, top2, bottom2, top, tod, bottom3 } = entry;
      const matchedTypes = [];

      // ✅ 2 ตัวบน
      if (top2 && number.slice(-2) === firstPrize.slice(-2)) {
        matchedTypes.push({ type: "2 ตัวบน", amount: top2 });
      }

      // ✅ 2 ตัวล่าง
      if (bottom2 && number === lastTwoDigits) {
        matchedTypes.push({ type: "2 ตัวล่าง", amount: bottom2 });
      }

      // ✅ 3 ตัวบน
      if (top && number === firstPrize.slice(-3)) {
        matchedTypes.push({ type: "3 ตัวบน", amount: top });
      }

      // ✅ โต๊ด (เลขสลับ 3 ตัวบน)
      if (tod && isTod(number, firstPrize.slice(-3))) {
        matchedTypes.push({ type: "โต๊ด", amount: tod });
      }

      // ✅ 3 ตัวหน้า (ตรงเท่านั้น)
      if (threeDigitFront.includes(number) && top) {
        matchedTypes.push({ type: "3 ตัวล่าง", amount: top });
      }

      // ✅ 3 ตัวล่าง (ตรงเท่านั้น)
      if (threeDigitBack.includes(number) && bottom3) {
        matchedTypes.push({ type: "3 ตัวล่าง", amount: bottom3 });
      }

      if (matchedTypes.length > 0) {
        winners.push({
          name: buyerName,
          number,
          matchedTypes,
        });
      }
    }

    // ✅ คนที่ "ถูกโต๊ด" จากเลข 6 กลับ
    for (const entry of checktod) {
      const { buyerName, number: entryNumber, tod } = entry;

      // ถ้าเลขตรง 3 ตัวบนอยู่แล้ว ไม่ต้องนับซ้ำ
      if (entryNumber === firstPrize.slice(-3)) continue;

      if (tod && isTod(number, firstPrize.slice(-3))) {
        winners.push({
          name: buyerName,
          number: entryNumber,
          matchedTypes: [
            {
              type: "โต๊ด",
              amount: tod,
            },
          ],
        });
      }
    }

    res.json({
      success: true,
      date: { date, month, year },
      winners,
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด", err);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์" });
  }
});

// ✅ เช็คเลขโต๊ด: สลับตำแหน่งกันได้
function isTod(input, target) {
  if (input.length !== 3 || target.length !== 3) return false;
  return input.split("").sort().join("") === target.split("").sort().join("");
}

// ✅ สร้างเลข 6 กลับ
function getTodVariants(number) {
  if (number.length !== 3) return [];
  const variants = new Set();
  const chars = number.split("");
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      for (let k = 0; k < 3; k++) {
        if (k === i || k === j) continue;
        variants.add(chars[i] + chars[j] + chars[k]);
      }
    }
  }
  return Array.from(variants);
}

export default router;
