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


router.get("/me", protect, getMe);

router.get("/supervisors", protect, authorize("admin", "super_admin"), getSupervisorsByDept);

router.post("/", protect, authorizeCreation, createUser);

router.get("/", protect, authorize("supervisor", "admin"), getAllUsers);
router.get("/:id", protect, authorize("supervisor", "admin"), getUserById);

router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
