import type { Request, Response } from "express";
import { Leave } from "../models/leave.js";
import { User } from "../models/user.js";
// import { Department } from "../models/department.js";
import { Notification } from "../models/notification.js";

const countWorkingDays = (start: Date, end: Date): number => {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0) count++; // Skip only Sunday (0)
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const deductLeaveBalance = async (employeeId: string, leaveType: string, startDate: Date, endDate: Date): Promise<void> => {
  const days = countWorkingDays(startDate, endDate);
  if (days <= 0) return;

  // Map leaveType to the User.leaveBalance field key
  const balanceFieldMap: Record<string, string> = {
    annual: "leaveBalance.annual",
    sick: "leaveBalance.sick",
    casual: "leaveBalance.casual",
    maternity: "leaveBalance.maternity",
  };

  const field = balanceFieldMap[leaveType];
  if (!field) return; 

  await User.findByIdAndUpdate(employeeId, {
    $inc: { [field]: -days },
  });
};

const createFinalNotification = async (leave: any, status: "approved" | "rejected") => {
  let remarks = [];
  if (leave.supervisorRemark) remarks.push(`Supervisor: ${leave.supervisorRemark}`);
  if (leave.adminRemark) remarks.push(`Admin: ${leave.adminRemark}`);
  if (leave.superAdminRemark) remarks.push(`Super Admin: ${leave.superAdminRemark}`);
  
  const remarksText = remarks.length > 0 ? ` (Remarks: ${remarks.join(" | ")})` : "";
  const msg = `Your ${leave.leaveType} leave from ${leave.startDate.toISOString().split("T")[0]} to ${leave.endDate.toISOString().split("T")[0]} has been ${status}${remarksText}.`;
  
  await Notification.create({
    userId: leave.employeeId,
    message: msg,
    type: status === "approved" ? "leave_approved" : "leave_rejected",
    relatedLeaveId: leave._id
  });
};

const populateLeave = (query: any): Promise<any> =>
  query
    .populate("employeeId", "name email role departmentId")
    .populate("supervisorId", "name email role")
    .populate("adminId", "name email role")
    .populate("superAdminId", "name email role")
    .lean();


const buildAdminFilter = async (actorId: string): Promise<Record<string, any> | null> => {
  const admin = await User.findById(actorId).select("departmentId");
  if (!admin?.departmentId) return null;

  // Find all user IDs in the same department
  const deptUsers = await User.find({ departmentId: admin.departmentId }).select("_id");
  const deptUserIds = deptUsers.map((u) => u._id);

  return { employeeId: { $in: deptUserIds } };
};

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

    const { role } = req.user!;
    let supervisorApproval = "pending";
    let adminApproval = "pending";
    let superAdminApproval = "not_required";
    let status = "pending";

    if (role === "supervisor") {
      supervisorApproval = "not_required";
    } else if (role === "admin") {
      supervisorApproval = "not_required";
      adminApproval = "not_required";
      superAdminApproval = "pending";
    } else if (role === "super_admin") {
      supervisorApproval = "not_required";
      adminApproval = "not_required";
      superAdminApproval = "not_required";
      status = "approved";
    }

    const leave = await Leave.create({
      employeeId: req.user!.id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status,
      supervisorApproval,
      adminApproval,
      superAdminApproval,
    });

    // If super_admin auto-approved, deduct balance immediately
    if (status === "approved") {
      await deductLeaveBalance(req.user!.id, leaveType, start, end);
    }

    const populated = await populateLeave(Leave.findById(leave._id));

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

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

export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, id } = req.user!;
    let filter: Record<string, any> = {};

    if (role === "supervisor") {
      // Employees whose supervisorId points to this supervisor
      const reportees = await User.find({ supervisorId: id }).select("_id");
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
      const employee = await User.findById(employeeId).select("supervisorId");
      if (employee?.supervisorId?.toString() !== id) {
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

export const supervisorAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, remark } = req.body;

    if (!action || !["approved", "rejected"].includes(action)) {
      res.status(400).json({ message: 'action must be "approved" or "rejected"' });
      return;
    }

    const leave = await Leave.findById(req.params.id).populate<{
      employeeId: { supervisorId?: any };
    }>("employeeId", "supervisorId");

    if (!leave) {
      res.status(404).json({ message: "Leave not found" });
      return;
    }

    // Prevent self-approval
    if ((leave.employeeId as any)._id.toString() === req.user!.id) {
      res.status(403).json({ message: "You cannot approve your own leave." });
      return;
    }

    // Verify this employee actually reports to this supervisor
    const supervisorIdVal = (leave.employeeId as any).supervisorId?.toString();
    if (supervisorIdVal !== req.user!.id) {
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
      await createFinalNotification(leave, "rejected");
    } else if (leave.adminApproval === "not_required" && leave.superAdminApproval === "not_required") {
      leave.status = "approved"; // If no further stages needed (rare edge case)
      // Deduct balance on final approval
      const empId = (leave.employeeId as any)._id ? (leave.employeeId as any)._id.toString() : leave.employeeId.toString();
      await deductLeaveBalance(empId, leave.leaveType, leave.startDate, leave.endDate);
      await createFinalNotification(leave, "approved");
    }

    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

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

    // Prevent self-approval
    if (leave.employeeId.toString() === req.user!.id) {
      res.status(403).json({ message: "You cannot approve your own leave." });
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

    // Stage 1 must be complete before admin can act (unless it was bypassed)
    if (leave.supervisorApproval !== "approved" && leave.supervisorApproval !== "not_required") {
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

    // Finalise overall status if no Stage 3 is required
    if (action === "rejected") {
      leave.status = "rejected";
      await createFinalNotification(leave, "rejected");
    } else if (leave.superAdminApproval === "not_required") {
      leave.status = "approved";
      // Deduct balance on final approval
      await deductLeaveBalance(leave.employeeId.toString(), leave.leaveType, leave.startDate, leave.endDate);
      await createFinalNotification(leave, "approved");
    }

    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const superAdminAction = async (req: Request, res: Response): Promise<void> => {
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

    // Prevent self-approval
    if (leave.employeeId.toString() === req.user!.id) {
      res.status(403).json({ message: "You cannot approve your own leave." });
      return;
    }

    if (leave.status === "cancelled") {
      res.status(400).json({ message: "Cannot act on a cancelled leave." });
      return;
    }

    // Prior stages must be complete or not_required
    if (
      (leave.supervisorApproval !== "approved" && leave.supervisorApproval !== "not_required") ||
      (leave.adminApproval !== "approved" && leave.adminApproval !== "not_required")
    ) {
      res.status(400).json({
        message: "Cannot act yet — prior approval stages are not complete.",
      });
      return;
    }

    if (leave.superAdminApproval !== "pending") {
      res.status(400).json({
        message: `Super Admin has already ${leave.superAdminApproval} this leave.`,
      });
      return;
    }

    // Apply stage 3
    leave.superAdminApproval = action;
    leave.superAdminId = req.user!.id as any;
    if (remark) leave.superAdminRemark = remark;

    // Finalise overall status
    leave.status = action === "approved" ? "approved" : "rejected";

    // Deduct balance on final approval
    if (action === "approved") {
      await deductLeaveBalance(leave.employeeId.toString(), leave.leaveType, leave.startDate, leave.endDate);
      await createFinalNotification(leave, "approved");
    } else {
      await createFinalNotification(leave, "rejected");
    }

    await leave.save();

    const populated = await populateLeave(Leave.findById(leave._id));
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
