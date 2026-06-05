import express from "express";
import {
  getMe,
  createUser,
  getAllUsers,
  getSupervisorsByDept,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/protect.middleware.js";
import { authorize, authorizeCreation } from "../middleware/role.middleware.js";

const router = express.Router();

// ── Own profile ──────────────────────────────
// GET /api/users/me
router.get("/me", protect, getMe);

// ── Supervisor lookup (dept-scoped) ──────────
// GET /api/users/supervisors?departmentId=xxx
// Returns supervisors filtered by department — used to populate the supervisor dropdown in user forms
// Must be registered BEFORE /:id to avoid "supervisors" being treated as an ID param
router.get("/supervisors", protect, authorize("admin", "super_admin"), getSupervisorsByDept);

// ── User creation ────────────────────────────
// POST /api/users
// authorizeCreation enforces the role-creation matrix and dept-scoping for admins
router.post("/", protect, authorizeCreation, createUser);

// ── User listing & detail ────────────────────
// GET /api/users          → super_admin sees all; admin sees own dept; supervisor sees own team
// GET /api/users/:id      → same scoping
router.get("/", protect, authorize("supervisor", "admin"), getAllUsers);
router.get("/:id", protect, authorize("supervisor", "admin"), getUserById);

// ── User updates & deletion ──────────────────
// PUT    /api/users/:id
// DELETE /api/users/:id
router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
