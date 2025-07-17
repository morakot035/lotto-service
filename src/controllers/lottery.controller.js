import express from "express";
import axios from "axios";
import dayjs from "dayjs";

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
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหวย",
    });
  }
});

export default router;
