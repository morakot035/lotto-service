import express from "express";
import {
  getBlockNumber,
  createBlockNumber,
  updateBlockNumber,
  deleteBlockNumber,
} from "../controllers/blocknumber.conntroller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getBlockNumber);
router.post("/", verifyToken, createBlockNumber);
router.put("/:id", verifyToken, updateBlockNumber);
router.delete("/:id", verifyToken, deleteBlockNumber);

export default router;
