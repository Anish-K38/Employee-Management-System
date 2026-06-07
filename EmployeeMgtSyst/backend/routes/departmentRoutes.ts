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

router.get("/", protect, authorize("super_admin", "admin"), getAllDepartments);

router.put("/:id", protect, authorize("super_admin"), updateDepartment);

router.delete("/:id", protect, authorize("super_admin"), deleteDepartment);

export default router;
