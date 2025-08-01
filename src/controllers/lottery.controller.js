import express from "express";
import axios from "axios";
import dayjs from "dayjs";
import Entry from "../models/Entry.js";

const router = express.Router();

router.post("/result", async (req, res) => {
  try {
    // ✅ หาวันที่งวดล่าสุด (1 หรือ 16)
    const now = dayjs();
    const day = now.date();

    const date = day >= 17 ? "16" : "01"; // ถ้าเลย 16 ให้ใช้ 16
    const month = now.format("MM");
    const year = now.format("YYYY");

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
        "สำนักงานสลากกินแบ่งรัฐบาลกำลังจะออกรางวััลเร็วๆนี้ โปรดรอสักครู่...",
    });
  }
});

router.get("/check-winners", async (req, res) => {
  try {
    const now = dayjs();
    const day = now.date();
    const date = day >= 17 ? "16" : "01";
    const month = now.format("MM");
    const year = now.format("YYYY");

    // ดึงผลรางวัลจาก GLO
    const response = await axios.post(
      "https://www.glo.or.th/api/checking/getLotteryResult",
      {
        date,
        month,
        year,
      }
    );

    const data = response.data.response.result.data;
    const firstPrize = data.first.number[0].value;
    const lastTwoDigits = data.last2.number[0].value;
    const threeDigitFront = data.last3f.number.map((n) => n.value);
    const threeDigitBack = data.last3b.number.map((n) => n.value);

    // ดึงข้อมูลหวยทั้งหมดจาก database
    const entries = await Entry.find();
    const winners = [];

    for (const entry of entries) {
      const { buyerName, number, top2, bottom2, top, tod, bottom3, source } =
        entry;

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

      // ✅ โต๊ด (เลข 3 ตัวสลับกัน)
      if (tod && isTod(number, firstPrize.slice(-3))) {
        matchedTypes.push({ type: "โต๊ด", amount: tod });
      }

      // ✅ 3 ตัวหน้า
      if (threeDigitFront.includes(number) && top) {
        matchedTypes.push({ type: "3 ตัวหน้า", amount: top });
      }

      // ✅ 3 ตัวท้าย
      if (threeDigitBack.includes(number) && bottom3) {
        matchedTypes.push({ type: "3 ตัวล่าง", amount: bottom3 });
      }

      if (matchedTypes.length > 0) {
        winners.push({
          name: buyerName,
          number,
          source,
          matchedTypes,
        });
      }
    }

    res.json({
      success: true,
      date: { date, month, year },
      winners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
  }
});

// ✅ เช็คเลขโต๊ด: สลับตำแหน่งกันได้
function isTod(input, target) {
  if (input.length !== 3 || target.length !== 3) return false;
  return input.split("").sort().join("") === target.split("").sort().join("");
}

export default router;
