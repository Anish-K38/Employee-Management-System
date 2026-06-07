import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  cancelLeave,
  supervisorAction,
  adminAction,
  superAdminAction,
} from "../controllers/leaveController.js";
import { protect } from "../middleware/protect.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/my", protect, getMyLeaves);
router.post("/", protect, applyLeave);
router.patch("/:id/cancel", protect, cancelLeave);
router.patch("/:id/supervisor-action", protect, authorize("supervisor"), supervisorAction);

router.patch("/:id/admin-action", protect, authorize("admin", "super_admin"), adminAction);

router.patch("/:id/superadmin-action", protect, authorize("super_admin"), superAdminAction);

router.get("/", protect, authorize("supervisor", "admin", "super_admin"), getAllLeaves);
router.get("/:id", protect, authorize("supervisor", "admin", "super_admin"), getLeaveById);

export default router;
