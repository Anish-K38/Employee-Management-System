import express from "express";
import {
  login,
  changePassword,
  forgotPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/protect.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);


router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

export default router;
