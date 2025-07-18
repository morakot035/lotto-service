const CutConfig = require("../models/CutConfig");
const sendError = require("../utils/sendError");

// POST: สร้าง/อัปเดตค่าตัดเก็บ
exports.saveCutConfig = async (req, res) => {
  try {
    const data = req.body;

    // ลบอันเก่า (กรณีมีหลาย user อาจแยกด้วย userId แทน)
    await CutConfig.deleteMany(); // สมมุติมีอันเดียว

    const config = new CutConfig(data);
    await config.save();

    res.status(201).json({ message: "บันทึกค่าตัดเก็บแล้ว", data: config });
  } catch (err) {
    console.error(err);
    sendError(res, "ไม่สามารถบันทึกค่าตัดเก็บได้");
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
