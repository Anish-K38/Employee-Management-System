import express from "express";
import { getKPIs, getTrends, getDistribution, getActivityFeed } from "../controllers/dashboardController.js";
import { protect } from "../middleware/protect.middleware.js";

const router = express.Router();

router.get("/kpis", protect, getKPIs);
router.get("/trends", protect, getTrends);
router.get("/distribution", protect, getDistribution);
router.get("/activity", protect, getActivityFeed);

export default router;
