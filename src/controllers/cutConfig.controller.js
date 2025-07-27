const CutConfig = require("../models/CutConfig");
const sendError = require("../utils/sendError");
const Entry = require("../models/Entry");

// POST: สร้าง/อัปเดตค่าตัดเก็บ พร้อมรีคำนวณ Entry ทั้งหมด
exports.saveCutConfig = async (req, res) => {
  try {
    const data = req.body;

    // ลบ config เดิมก่อน (ถ้ามี)
    await CutConfig.deleteMany(); // กรณีมี config เดียว

    // สร้าง config ใหม่
    const config = new CutConfig(data);
    await config.save();

    // ⏬ รีคำนวณ Entry ทั้งหมดตาม config ใหม่
    const allEntries = await Entry.find({});

    const calcKeepSent = (amount, limit) => {
      const kept = Math.min(amount, limit);
      const sent = Math.max(amount - limit, 0);
      return {
        total: amount.toString(),
        kept: kept.toString(),
        sent: sent.toString(),
      };
    };

    for (const entry of allEntries) {
      const { number } = entry;
      const numLength = number.trim().length;

      if (entry.top) {
        const limit =
          numLength === 3
            ? parseFloat(config.threeDigitTop)
            : parseFloat(config.twoDigitTop);
        const amount = parseFloat(entry.top.total);
        entry.top = calcKeepSent(amount, limit);
      }

      if (entry.top2 && numLength === 2) {
        const limit = parseFloat(config.twoDigitTop);
        const amount = parseFloat(entry.top2.total);
        entry.top2 = calcKeepSent(amount, limit);
      }

      if (entry.tod && numLength === 3) {
        const limit = parseFloat(config.threeDigitTod);
        const amount = parseFloat(entry.tod.total);
        entry.tod = calcKeepSent(amount, limit);
      }

      if (entry.bottom3 && numLength === 3) {
        const limit = parseFloat(config.threeDigitBottom);
        const amount = parseFloat(entry.bottom3.total);
        entry.bottom3 = calcKeepSent(amount, limit);
      }

      if (entry.bottom2 && numLength === 2) {
        const limit = parseFloat(config.twoDigitBottom);
        const amount = parseFloat(entry.bottom2.total);
        entry.bottom2 = calcKeepSent(amount, limit);
      }

      await entry.save();
    }

    // ✅ ตอบกลับเมื่อเสร็จ
    res.status(201).json({
      message: "บันทึกค่าตัดเก็บและรีคำนวณ Entry สำเร็จ",
      data: config,
    });
  } catch (err) {
    console.error(err);
    sendError(res, "ไม่สามารถบันทึกค่าตัดเก็บหรือรีคำนวณ Entry ได้");
  }
};

// GET: ดึงค่าตัดเก็บล่าสุด
exports.getCutConfig = async (req, res) => {
  try {
    const config = await CutConfig.findOne().sort({ createdAt: -1 });

    if (!config) {
      return res.status(404).json({ message: "ยังไม่มีการตั้งค่าตัดเก็บ" });
    }

    res.json({ data: config });
  } catch (err) {
    console.error(err);
    sendError(res, "เกิดข้อผิดพลาดในการโหลดค่าตัดเก็บ");
  }
};
