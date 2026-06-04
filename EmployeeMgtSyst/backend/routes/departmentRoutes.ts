import express from "express";
import {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/protect.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// GET /api/departments
// Both super_admin and admin can fetch departments (admins need it for user dropdowns)
router.get("/", protect, authorize("super_admin", "admin"), getAllDepartments);

// POST /api/departments (Super Admin only)
router.post("/", protect, authorize("super_admin"), createDepartment);

// PUT /api/departments/:id (Super Admin only)
router.put("/:id", protect, authorize("super_admin"), updateDepartment);

// DELETE /api/departments/:id (Super Admin only)
router.delete("/:id", protect, authorize("super_admin"), deleteDepartment);

export default router;
