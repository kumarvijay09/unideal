import { Router } from "express";
import { config } from "../config.js";
import { getStats } from "../database/db.js";

const router = Router();
const startTime = Date.now();

router.get("/", (req, res) => {
  const stats = getStats();
  res.json({
    status: "ok",
    app: "UniDeal Campus Marketplace API",
    version: "1.0.0",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    metrics: stats,
  });
});

export default router;
