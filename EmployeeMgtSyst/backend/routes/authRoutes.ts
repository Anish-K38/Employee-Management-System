import express from "express";
import {
  login,
  changePassword,
  forgotPassword,
  getMe,
  // register,  // ← commented out — public registration removed for security
} from "../controllers/authController.js";
import { protect } from "../middleware/protect.middleware.js";

const router = express.Router();

// Public routes
// router.post("/register", register); // ← disabled — accounts created by admins only
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// Protected routes
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

export default router;
