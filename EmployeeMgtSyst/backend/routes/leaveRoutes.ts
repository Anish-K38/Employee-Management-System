import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  cancelLeave,
  supervisorAction,
  adminAction,
} from "../controllers/leaveController.js";
import { protect } from "../middleware/protect.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// ── Own leave history ────────────────────────────────────────
// GET  /api/leaves/my  — any authenticated user sees their own leaves
router.get("/my", protect, getMyLeaves);

// ── Apply for leave ──────────────────────────────────────────
// POST /api/leaves  — any authenticated user can apply
router.post("/", protect, applyLeave);

// ── Cancel own leave ─────────────────────────────────────────
// PATCH /api/leaves/:id/cancel  — owner only, only while pending
router.patch("/:id/cancel", protect, cancelLeave);

// ── Stage 1: Supervisor acts ─────────────────────────────────
// PATCH /api/leaves/:id/supervisor-action
router.patch("/:id/supervisor-action", protect, authorize("supervisor"), supervisorAction);

// ── Stage 2: Admin acts ──────────────────────────────────────
// PATCH /api/leaves/:id/admin-action
router.patch("/:id/admin-action", protect, authorize("admin"), adminAction);

// ── View leaves (scoped) ─────────────────────────────────────
// GET /api/leaves        — supervisor+ (scoped by role)
// GET /api/leaves/:id    — supervisor+ or leave owner
router.get("/", protect, authorize("supervisor"), getAllLeaves);
router.get("/:id", protect, authorize("supervisor"), getLeaveById);

export default router;
