// controllers/blockNumber.controller.js
const BlockNumber = require("../models/BlockNumber");
const { sendErrorResponse } = require("../utils/sendError");

// ✅ GET /api/getBlockNumber
exports.getBlockNumber = async (req, res) => {
  try {
    const block = await BlockNumber.find();
    res.json({ success: true, data: block });
  } catch (error) {
    sendErrorResponse(res, 500, "SERVER_ERROR", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
  }
};

// ✅ POST /api/blocknumber
exports.createBlockNumber = async (req, res) => {
  try {
    const { number } = req.body;
    const newBlock = new BlockNumber({ number });
    await newBlock.save();
    res.status(201).json({ success: true, data: newBlock });
  } catch (error) {
    return sendErrorResponse(
      res,
      400,
      "VALIDATION_ERROR",
      "ไม่สามารถเพิ่มเลขไม่รับซื้อได้"
    );
  }
};

// ✅ PUT /api/blocknumber/:id
exports.updateBlockNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { number } = req.body;
    const updated = await BlockNumber.findByIdAndUpdate(
      id,
      { number },
      { new: true }
    );

    if (!updated) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "ไม่พบเลขไม่รับซื้อ");
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    return sendErrorResponse(
      res,
      400,
      "UPDATE_ERROR",
      "ไม่สามารถแก้ไขข้อมูลได้"
    );
  }
};

// ✅ DELETE /api/blocknumber/:id
exports.deleteBlockNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BlockNumber.findByIdAndDelete(id);

    if (!deleted) {
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "ไม่พบเลขที่ไม่รับซื้อที่ต้องการลบ"
      );
    }

    res.json({ success: true, message: "ลบเรียบร้อยแล้ว" });
  } catch (error) {
    return sendErrorResponse(res, 400, "DELETE_ERROR", "ไม่สามารถลบข้อมูลได้");
  }
};
