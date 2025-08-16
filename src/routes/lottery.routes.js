import express from "express";
import lotteryController from "../controllers/lottery.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ผูก controller กับ route
router.use("/", lotteryController);

export default router;
