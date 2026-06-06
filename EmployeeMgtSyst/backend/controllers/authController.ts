import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";


export const generateToken = (id: string, role: string, rememberMe = false) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET!,
    { expiresIn: rememberMe ? "30d" : "1d" }
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please enter all fields" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }


    if (!user.isActive) {
      res.status(403).json({ message: "Your account has been deactivated. Contact your administrator." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.json({
      token: generateToken(user.id, user.role, rememberMe),
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};



export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "currentPassword and newPassword are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters" });
      return;
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Forgot password — stub (email delivery deferred)
// @route   POST /api/auth/forgot-password
// @access  Public
// Body: { email }
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // NOTE: We deliberately do not reveal whether the email exists (security best practice)
    // TODO: When mail provider is configured, generate a reset token, store it,
    //       and send a reset link to this email address.

    res.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get own profile (auth check endpoint)
// @route   GET /api/auth/me
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id)
      .select("-password")
      .populate("departmentId", "name description")
      .populate("supervisorId", "name email role")
      .populate("createdBy", "name email role");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
