const express = require("express");
const router = express.Router();
const {
  saveCutConfig,
  getCutConfig,
} = require("../controllers/cutConfig.controller");
const verifyToken = require("../middlewares/verifyToken");

router.get("/cut-config", verifyToken, getCutConfig);
router.post("/cut-config", verifyToken, saveCutConfig);

module.exports = router;
