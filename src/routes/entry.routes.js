import express from "express";
import { createLottery } from "../controllers/entry.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/result", verifyToken, createLottery);

export default router;
