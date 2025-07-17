import express from "express";
import axios from "axios";

const router = express.Router();

// POST /api/lottery/result
router.post("/result", async (req, res) => {
  const { date, month, year } = req.body;

  try {
    const response = await axios.post("https://www.glo.or.th/api/checking/getLotteryResult", {
      date,
      month,
      year,
    });

    if (response.data && response.data.status === "success") {
      const result = response.data.result;

      // ✅ แปลงให้อยู่ในรูปแบบที่ต้องการ
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
