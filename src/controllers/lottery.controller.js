import express from "express";
import axios from "axios";
import dayjs from "dayjs";

const router = express.Router();


router.post("/result", async (req, res) => {
  try {
    let { date, month, year } = req.body;

    // ✅ ถ้าไม่มี date ให้หา date ล่าสุดงวด 1 หรือ 16
    if (!date || !month || !year) {
      const now = dayjs(); // วันนี้
      const day = now.date();

      // กำหนดเป็นงวดล่าสุด (ถ้าวันที่ยังไม่ถึง 16 จะใช้ 1, ถ้าเกิน 16 ใช้ 16)
      if (day >= 17) {
        date = "16";
      } else {
        date = "01";
      }

      month = now.format("MM");
      year = now.format("YYYY");
    }

    const response = await axios.post("https://www.glo.or.th/api/checking/getLotteryResult", {
      date,
      month,
      year,
    });

    if (response.data?.status === "success") {
      res.status(200).json({ success: true, data: response.data.result });
    } else {
      res.status(404).json({ success: false, message: "ไม่พบข้อมูลผลสลากกินแบ่ง" });
    }
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลหวย" });
  }
});