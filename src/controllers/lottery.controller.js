import express from "express";
import axios from "axios";

const router = express.Router();

// POST /api/lottery/result
router.post("/result", async (_req, res) => {
  try {
    const now = new Date();

    let date = 1;
    let month = now.getMonth() + 1; // เดือนเป็น 0-based
    let year = now.getFullYear();

    const day = now.getDate();

    if (day >= 16) {
      date = 16;
    } else if (day >= 1) {
      date = 1;
    }

    // ถ้าเป็นวันที่ 1 แต่ก่อนเวลา 15:00 ยังไม่ประกาศ ให้ใช้รอบ 16 ของเดือนก่อนหน้า
    if (date === 1 && day === 1 && now.getHours() < 15) {
      date = 16;
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
    }

    if (date === 16 && day === 16 && now.getHours() < 15) {
      // ถ้าวันนี้ 16 แต่มายังไม่ถึงเวลาออกรางวัล ให้ใช้วันที่ 1 แทน
      date = 1;
    }

    const payload = {
      date: date.toString().padStart(2, "0"),
      month: month.toString().padStart(2, "0"),
      year: year.toString(),
    };

    const response = await axios.post("https://www.glo.or.th/api/checking/getLotteryResult", payload);

    if (response.data && response.data.status === "success") {
      const result = response.data.result;
      const formattedResult = {
        firstPrize: result["รางวัลที่ 1"]?.[0] || "",
        lastTwoDigits: result["เลขท้าย 2 ตัว"]?.[0] || "",
        threeDigitFront: result["เลขหน้า 3 ตัว"] || [],
        threeDigitBack: result["เลขท้าย 3 ตัว"] || [],
      };

      res.status(200).json({ success: true, data: formattedResult });
    } else {
      res.status(404).json({ success: false, message: "ไม่พบข้อมูลผลสลากกินแบ่ง" });
    }
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลหวย" });
  }
});

export default router;
