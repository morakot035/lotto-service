import express from "express";
import {
  createLottery,
  getByBuyer,
  deleteEntry,
  getAll,
  deletePair,
  saveDealerEntries,
} from "../controllers/entry.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/result", verifyToken, createLottery);
router.get("/by-buyer/:buyerName", verifyToken, getByBuyer);
router.post("/delete", verifyToken, deleteEntry);
router.get("/all", verifyToken, getAll);
router.post("/deletePair", verifyToken, deletePair);
router.post("/lottery/dealer", verifyToken, saveDealerEntries);
export default router;
