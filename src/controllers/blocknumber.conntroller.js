import BlockNumber from '../models/BlockNumber.js'
import { sendErrorResponse } from '../utils/sendError.js';

// ✅ GET /api/getBlockNumber
export const getBlockNumber = async (req, res) => {
  try {
    const block = await BlockNumber.find();
    res.json({ success: true, data: block });
  } catch (error) {
    sendErrorResponse(res, 500, "SERVER_ERROR", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
  }
};

// ✅ POST /api/blocknumber
export const createBlockNumber = async (req, res) => {
  try {
    const { number } = req.body;
    const newBlock = new Buyer({ number });
    await newBlock.save();
    res.status(201).json({ success: true, data: newBlock });
  } catch (error) {
    return sendErrorResponse(res, 400, "VALIDATION_ERROR", "ไม่สามารถเพิ่มเลขไม่รัับซื้อได้");
  }
};



// ✅ PUT /api/blocknumber/:id
export const updateBlockNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { number } = req.body;
    const updated = await BlockNumber.findByIdAndUpdate(id, { number }, { new: true });

    if (!updated) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "ไม่พบเลขไม่รับซื้อ");
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    return sendErrorResponse(res, 400, "UPDATE_ERROR", "ไม่สามารถแก้ไขข้อมูลได้");
  }
};

export const deleteBlockNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BlockNumber.findByIdAndDelete(id);

    if (!deleted) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "ไม่พบเลขที่ไม่รับซื้อที่ต้องการลบ");
    }

    res.json({ success: true, message: "ลบเรียบร้อยแล้ว" });
  } catch (error) {
    return sendErrorResponse(res, 400, "DELETE_ERROR", "ไม่สามารถลบข้อมูลได้");
  }
};