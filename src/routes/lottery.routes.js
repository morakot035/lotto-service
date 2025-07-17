import express from "express";
import lotteryController from "../controllers/lottery.controller.js";

const router = express.Router();

// ผูก controller กับ route
router.use("/", lotteryController);

export default router;