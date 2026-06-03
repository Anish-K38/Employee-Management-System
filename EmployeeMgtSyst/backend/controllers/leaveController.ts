import type { Request, Response } from "express";
import { Leave } from "../models/leave.js";
import { User } from "../models/user.js";
import { Department } from "../models/department.js";

// ─────────────────────────────────────────────────────────────
// Helper: populate all refs on a leave document
// Returns Promise<any> so callers can freely access populated fields
// ─────────────────────────────────────────────────────────────
const populateLeave = (query: any): Promise<any> =>
  query
    .populate("employeeId", "name email role departmentId")
    .populate("supervisorId", "name email role")
    .populate("adminId", "name email role")
    .lean();


// ─────────────────────────────────────────────────────────────
// Helper: build a dept-scoped filter for admin/super_admin
// ─────────────────────────────────────────────────────────────
const buildAdminFilter = async (actorId: string): Promise<Record<string, any> | null> => {
  const admin = await User.findById(actorId).select("departmentId");
  if (!admin?.departmentId) return null;

  // Find all user IDs in the same department
  const deptUsers = await User.find({ departmentId: admin.departmentId }).select("_id");
  const deptUserIds = deptUsers.map((u) => u._id);

  return { employeeId: { $in: deptUserIds } };
};

// ─────────────────────────────────────────────────────────────
// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Any authenticated user (typically employee)
// ─────────────────────────────────────────────────────────────
export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      res.status(400).json({ message: "leaveType, startDate, endDate and reason are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    if (end < start) {
      res.status(400).json({ message: "endDate cannot be before startDate" });
      return;
    }

    const leave = await Leave.create({
      employeeId: req.user!.id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: "pending",
      supervisorApproval: "pending",
      adminApproval: "pending",
    });

    const populated = await populateLeave(Leave.findById(leave._id));

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get own leave history
// @route   GET /api/leaves/my
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaves = await populateLeave(
      Leave.find({ employeeId: req.user!.id }).sort({ createdAt: -1 }) as any
    );

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all leaves (scoped by role)
// @route   GET /api/leaves
// @access  supervisor | admin | super_admin
//   supervisor  → only employees who report to them (managerId = actor._id)
//   admin       → all employees in their department
//   super_admin → everything
// ─────────────────────────────────────────────────────────────
export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, id } = req.user!;
    let filter: Record<string, any> = {};

    if (role === "supervisor") {
      // Employees whose managerId points to this supervisor
      const reportees = await User.find({ managerId: id }).select("_id");
      const reporteeIds = reportees.map((u) => u._id);
      filter = { employeeId: { $in: reporteeIds } };
    } else if (role === "admin") {
      const adminFilter = await buildAdminFilter(id);
      if (!adminFilter) {
        res.status(403).json({ message: "Admin must belong to a department to view leaves." });
        return;
      }
      filter = adminFilter;
    }
    // super_admin → filter stays {} (all)

    const leaves = await populateLeave(
      Leave.find(filter).sort({ createdAt: -1 }) as any
    );

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get a single leave by ID (scoped)
// @route   GET /api/leaves/:id
// @access  supervisor | admin | super_admin  (or owner)
// ─────────────────────────────────────────────────────────────
export const getLeaveById = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await populateLeave(Leave.findById(req.params.id));

    if (!leave) {
      res.status(404).json({ message: "Leave not found" });
      return;
    }

    const { role, id } = req.user!;
    // After populate, employeeId is a full document; cast to any to access _id safely
    const populatedEmployee = leave.employeeId as any;
    const employeeId: string = populatedEmployee?._id
      ? populatedEmployee._id.toString()
      : leave.employeeId.toString();

    // Owner can always see their own leave
    if (employeeId === id) {
      res.json(leave);
      return;
    }

    // Supervisor can see leaves of their reportees
    if (role === "supervisor") {
      const employee = await User.findById(employeeId).select("managerId");
      if (employee?.managerId?.toString() !== id) {
        res.status(403).json({ message: "Access denied. This employee does not report to you." });
        return;
      }
    }

    // Admin can see leaves within their dept
    if (role === "admin") {
      const adminFilter = await buildAdminFilter(id);
      if (!adminFilter) {
        res.status(403).json({ message: "Admin must belong to a department." });
        return;
      }
      const deptUserIds: string[] = (adminFilter.employeeId.$in as any[]).map((id: any) =>
        id.toString()
      );
      if (!deptUserIds.includes(employeeId)) {
        res.status(403).json({ message: "Access denied. Leave is outside your department." });
        return;
      }
    }

    res.json(leave);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Cancel own leave (only while pending)
// @route   PATCH /api/leaves/:id/cancel
// @access  Leave owner only
// ─────────────────────────────────────────────────────────────
export const cancelLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404).json({ message: "Leave not found" });
      return;
    }

    if (leave.employeeId.toString() !== req.user!.id) {
      res.status(403).json({ message: "Access denied. You can only cancel your own leave." });
      return;
    }

    if (leave.status !== "pending") {
      res.status(400).json({
        message: `Cannot cancel a leave that is already "${leave.status}".`,
      });
      return;
    }

    leave.status = "cancelled";
    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Supervisor approves or rejects a leave (Stage 1)
// @route   PATCH /api/leaves/:id/supervisor-action
// @access  supervisor only
// Body: { action: "approved" | "rejected", remark?: string }
// ─────────────────────────────────────────────────────────────
export const supervisorAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, remark } = req.body;

    if (!action || !["approved", "rejected"].includes(action)) {
      res.status(400).json({ message: 'action must be "approved" or "rejected"' });
      return;
    }

    const leave = await Leave.findById(req.params.id).populate<{
      employeeId: { managerId?: any };
    }>("employeeId", "managerId");

    if (!leave) {
      res.status(404).json({ message: "Leave not found" });
      return;
    }

    // Verify this employee actually reports to this supervisor
    const managerId = (leave.employeeId as any).managerId?.toString();
    if (managerId !== req.user!.id) {
      res.status(403).json({
        message: "Access denied. This employee does not report to you.",
      });
      return;
    }

    if (leave.status === "cancelled") {
      res.status(400).json({ message: "Cannot act on a cancelled leave." });
      return;
    }

    if (leave.supervisorApproval !== "pending") {
      res.status(400).json({
        message: `Supervisor has already ${leave.supervisorApproval} this leave.`,
      });
      return;
    }

    // Apply stage 1
    leave.supervisorApproval = action;
    leave.supervisorId = req.user!.id as any;
    if (remark) leave.supervisorRemark = remark;

    // Short-circuit: if rejected, mark overall status as rejected immediately
    if (action === "rejected") {
      leave.status = "rejected";
    }

    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin approves or rejects a leave (Stage 2)
// @route   PATCH /api/leaves/:id/admin-action
// @access  admin | super_admin
// Body: { action: "approved" | "rejected", remark?: string }
// ─────────────────────────────────────────────────────────────
export const adminAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, remark } = req.body;

    if (!action || !["approved", "rejected"].includes(action)) {
      res.status(400).json({ message: 'action must be "approved" or "rejected"' });
      return;
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404).json({ message: "Leave not found" });
      return;
    }

    // Admin dept-scoping check
    if (req.user!.role === "admin") {
      const adminFilter = await buildAdminFilter(req.user!.id);
      if (!adminFilter) {
        res.status(403).json({ message: "Admin must belong to a department." });
        return;
      }
      const deptUserIds: string[] = (adminFilter.employeeId.$in as any[]).map((id: any) =>
        id.toString()
      );
      if (!deptUserIds.includes(leave.employeeId.toString())) {
        res.status(403).json({ message: "Access denied. Leave is outside your department." });
        return;
      }
    }

    if (leave.status === "cancelled") {
      res.status(400).json({ message: "Cannot act on a cancelled leave." });
      return;
    }

    // Stage 1 must be complete before admin can act
    if (leave.supervisorApproval !== "approved") {
      res.status(400).json({
        message:
          leave.supervisorApproval === "pending"
            ? "Cannot act yet — supervisor approval is still pending."
            : "Leave was already rejected by the supervisor.",
      });
      return;
    }

    if (leave.adminApproval !== "pending") {
      res.status(400).json({
        message: `Admin has already ${leave.adminApproval} this leave.`,
      });
      return;
    }

    // Apply stage 2
    leave.adminApproval = action;
    leave.adminId = req.user!.id as any;
    if (remark) leave.adminRemark = remark;

    // Finalise overall status
    leave.status = action === "approved" ? "approved" : "rejected";

    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
