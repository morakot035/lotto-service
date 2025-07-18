import express from "express";
import {
  saveCutConfig,
  getCutConfig,
} from "../controllers/cutConfig.controller";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/cut-config", verifyToken, getCutConfig);
router.post("/cut-config", verifyToken, saveCutConfig);

export default router;
