import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { Department } from "../models/department.js"; // Import Department to register the schema in Mongoose


// ─────────────────────────────────────────────
// Helper: build a scoped query filter for admins
// ─────────────────────────────────────────────
const buildScopeFilter = async (
  actorId: string,
  actorRole: string
): Promise<Record<string, any> | null> => {
  if (actorRole === "super_admin") return {}; // no filter — see everything

  if (actorRole === "admin") {
    const admin = await User.findById(actorId).select("departmentId");
    if (!admin?.departmentId) return null; // admin has no dept → block
    return { departmentId: admin.departmentId };
  }
  
  if (actorRole === "supervisor") {
    return { supervisorId: actorId };
  }

  return null; // employee → not allowed to list
};

// ─────────────────────────────────────────────
// @desc    Get own profile
// @route   GET /api/users/me
// @access  Any authenticated user
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// @desc    Create a new user
// @route   POST /api/users
// @access  super_admin | admin  (authorizeCreation middleware validates role matrix)
// ─────────────────────────────────────────────
// Helper: generate a random alphanumeric temporary password
const generateTempPassword = (length = 10): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, departmentId, supervisorId } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: "name and email are required" });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "A user with that email already exists" });
      return;
    }

    // Auto-generate a temporary password — admin shares it with the new user.
    // User is forced to change it on first login (mustChangePassword = true).
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "employee",
      departmentId: departmentId || null,
      supervisorId: supervisorId || null,
      createdBy: req.user!.id,
      mustChangePassword: true,   // forces password change on first login
      isActive: true,
    });

    const populated = await User.findById(user._id)
      .select("-password")
      .populate("departmentId", "name description")
      .populate("supervisorId", "name email role")
      .populate("createdBy", "name email role");

    // Return the temp password once — the admin must share it with the new user.
    res.status(201).json({
      user: populated,
      temporaryPassword: tempPassword,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all users (scoped by role)
// @route   GET /api/users
// @access  super_admin (all) | admin (own dept)
// ─────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await buildScopeFilter(req.user!.id, req.user!.role);

    if (filter === null) {
      res.status(403).json({ message: "Access denied. Insufficient privileges to list users." });
      return;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("departmentId", "name description")
      .populate("supervisorId", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// @desc    Get supervisors scoped by department
// @route   GET /api/users/supervisors?departmentId=xxx
// @access  super_admin | admin
// Returns only users with role=supervisor optionally filtered by department
// ─────────────────────────────────────────────
export const getSupervisorsByDept = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.query;

    const filter: Record<string, any> = { role: "supervisor" };

    // If caller is admin, scope to their own department only (ignore query param)
    if (req.user!.role === "admin") {
      const admin = await User.findById(req.user!.id).select("departmentId");
      if (!admin?.departmentId) {
        res.json([]); // admin with no dept sees no supervisors
        return;
      }
      filter.departmentId = admin.departmentId;
    } else if (departmentId) {
      // super_admin can filter by any department
      filter.departmentId = departmentId;
    }

    const supervisors = await User.find(filter)
      .select("_id name email departmentId")
      .populate("departmentId", "name")
      .sort({ name: 1 });

    res.json(supervisors);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// @desc    Get a single user by ID (scoped)
// @route   GET /api/users/:id
// @access  super_admin | admin (own dept)
// ─────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await buildScopeFilter(req.user!.id, req.user!.role);

    if (filter === null) {
      res.status(403).json({ message: "Access denied. Insufficient privileges." });
      return;
    }

    const user = await User.findOne({ _id: req.params.id, ...filter })
      .select("-password")
      .populate("departmentId", "name description")
      .populate("supervisorId", "name email role")
      .populate("createdBy", "name email role");

    if (!user) {
      res.status(404).json({ message: "User not found or outside your scope" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// @desc    Update a user (scoped)
// @route   PUT /api/users/:id
// @access  super_admin | admin (own dept)
// ─────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await buildScopeFilter(req.user!.id, req.user!.role);

    if (filter === null) {
      res.status(403).json({ message: "Access denied. Insufficient privileges." });
      return;
    }

    // Prevent privilege escalation — admin cannot promote to admin/super_admin
    if (req.user!.role === "admin" && req.body.role) {
      const ADMIN_ALLOWED_ROLES = ["supervisor", "employee"];
      if (!ADMIN_ALLOWED_ROLES.includes(req.body.role)) {
        res.status(403).json({
          message: `Access denied. An admin cannot assign role "${req.body.role}".`,
        });
        return;
      }
    }

    const allowedUpdates: Record<string, any> = {};
    const updatableFields = ["name", "email", "role", "departmentId", "supervisorId"];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) allowedUpdates[field] = req.body[field];
    });

    // Handle password update separately
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      allowedUpdates.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, ...filter },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("departmentId", "name description")
      .populate("supervisorId", "name email role")
      .populate("createdBy", "name email role");

    if (!user) {
      res.status(404).json({ message: "User not found or outside your scope" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete a user (scoped)
// @route   DELETE /api/users/:id
// @access  super_admin | admin (own dept)
// ─────────────────────────────────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user!.id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    const filter = await buildScopeFilter(req.user!.id, req.user!.role);

    if (filter === null) {
      res.status(403).json({ message: "Access denied. Insufficient privileges." });
      return;
    }

    // Prevent admin from deleting another admin or super_admin
    if (req.user!.role === "admin") {
      const target = await User.findOne({ _id: req.params.id, ...filter }).select("role");
      if (!target) {
        res.status(404).json({ message: "User not found or outside your scope" });
        return;
      }
      if (target.role === "admin" || target.role === "super_admin") {
        res.status(403).json({
          message: "An admin cannot delete another admin or super_admin.",
        });
        return;
      }
    }

    const user = await User.findOneAndDelete({ _id: req.params.id, ...filter });

    if (!user) {
      res.status(404).json({ message: "User not found or outside your scope" });
      return;
    }

    res.json({ message: "User deleted successfully", id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
