import type { Request, Response } from "express";
import { Leave } from "../models/leave.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";


export const getKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (role === "employee") {
      const user = await User.findById(id).select("leaveBalance");
      
      // Count approved leaves by type for this year
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const [pendingRequests, approvedLeaves] = await Promise.all([
        Leave.countDocuments({ employeeId: id, status: "pending" }),
        Leave.find({ employeeId: id, status: "approved", startDate: { $gte: yearStart } }).select("leaveType startDate endDate").lean()
      ]);

      // Count used leaves per type
      const usedByType: Record<string, number> = {};
      for (const l of approvedLeaves) {
        usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + 1;
      }

      const totalTaken = approvedLeaves.length;

      const lb = user?.leaveBalance || { annual: 0, sick: 0, casual: 0, maternity: 0 };

      res.json({
        annualBalance: lb.annual,
        sickBalance: lb.sick,
        casualBalance: lb.casual,
        maternityBalance: lb.maternity,
        pendingRequests,
        totalTaken,
        recentLeaves: approvedLeaves.map(l => ({
          _id: l._id,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate
        })),
        leaveBalances: {
          annual:    { remaining: lb.annual,    total: lb.annual    + (usedByType["annual"] || 0) },
          sick:      { remaining: lb.sick,      total: lb.sick      + (usedByType["sick"] || 0) },
          casual:    { remaining: lb.casual,    total: lb.casual    + (usedByType["casual"] || 0) },
          maternity: { remaining: lb.maternity, total: lb.maternity + (usedByType["maternity"] || 0) },
        }
      });
      return;
    }

    if (role === "supervisor") {
      const reportees = await User.find({ supervisorId: id }).select("_id");
      const reporteeIds = reportees.map((u) => u._id);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const nextWeekStart = new Date(todayStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      const [onLeaveTodayLeaves, pendingReview, upcomingLeaves] = await Promise.all([
        Leave.find({ employeeId: { $in: reporteeIds }, status: "approved", startDate: { $lte: todayStart }, endDate: { $gte: todayStart } }).populate("employeeId", "name email avatar").lean(),
        Leave.countDocuments({ employeeId: { $in: reporteeIds }, supervisorApproval: "pending", status: "pending" }),
        Leave.countDocuments({ employeeId: { $in: reporteeIds }, status: "approved", startDate: { $gt: todayStart, $lte: nextWeekStart } })
      ]);
      const onLeaveToday = onLeaveTodayLeaves.length;

      // Also fetch supervisor's own leave balance
      const user = await User.findById(id).select("leaveBalance");
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const approvedLeaves = await Leave.find({ employeeId: id, status: "approved", startDate: { $gte: yearStart } }).select("leaveType").lean();
      const usedByType: Record<string, number> = {};
      for (const l of approvedLeaves) {
        usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + 1;
      }
      const lb = user?.leaveBalance || { annual: 0, sick: 0, casual: 0, maternity: 0 };

      res.json({
        teamMembers: reporteeIds.length,
        onLeaveToday,
        onLeaveEmployees: onLeaveTodayLeaves.map((l: any) => ({
          ...l.employeeId,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate
        })),
        pendingReview,
        upcomingLeaves,
        leaveBalances: {
          annual:    { remaining: lb.annual,    total: lb.annual    + (usedByType["annual"] || 0) },
          sick:      { remaining: lb.sick,      total: lb.sick      + (usedByType["sick"] || 0) },
          casual:    { remaining: lb.casual,    total: lb.casual    + (usedByType["casual"] || 0) },
          maternity: { remaining: lb.maternity, total: lb.maternity + (usedByType["maternity"] || 0) },
        }
      });
      return;
    }

    if (role === "admin") {
      const actor = await User.findById(id).select("departmentId");
      if (!actor?.departmentId) {
        res.status(403).json({ message: "Admin must belong to a department to view dashboard." });
        return;
      }

      const deptUsers = await User.find({ departmentId: actor.departmentId, role: { $in: ["employee", "supervisor"] } }).select("_id");
      const deptUserIds = deptUsers.map((u) => u._id);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayStart = new Date(`${todayStr}T00:00:00.000Z`);

      const [onLeaveTodayLeaves, pendingApprovals, rejectedThisMonth] = await Promise.all([
        Leave.find({ employeeId: { $in: deptUserIds }, status: "approved", startDate: { $lte: todayStart }, endDate: { $gte: todayStart } }).populate("employeeId", "name email avatar").lean(),
        Leave.countDocuments({ employeeId: { $in: deptUserIds }, supervisorApproval: "approved", adminApproval: "pending" }),
        Leave.countDocuments({ employeeId: { $in: deptUserIds }, status: "rejected", updatedAt: { $gte: monthStart } })
      ]);
      const onLeaveToday = onLeaveTodayLeaves.length;

      // Also fetch admin's own leave balance
      const user = await User.findById(id).select("leaveBalance");
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const approvedLeaves = await Leave.find({ employeeId: id, status: "approved", startDate: { $gte: yearStart } }).select("leaveType").lean();
      const usedByType: Record<string, number> = {};
      for (const l of approvedLeaves) {
        usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + 1;
      }
      const lb = user?.leaveBalance || { annual: 0, sick: 0, casual: 0, maternity: 0 };

      res.json({
        departmentSize: deptUserIds.length,
        onLeaveToday,
        onLeaveEmployees: onLeaveTodayLeaves.map((l: any) => ({
          ...l.employeeId,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate
        })),
        pendingApprovals,
        rejectedThisMonth,
        leaveBalances: {
          annual:    { remaining: lb.annual,    total: lb.annual    + (usedByType["annual"] || 0) },
          sick:      { remaining: lb.sick,      total: lb.sick      + (usedByType["sick"] || 0) },
          casual:    { remaining: lb.casual,    total: lb.casual    + (usedByType["casual"] || 0) },
          maternity: { remaining: lb.maternity, total: lb.maternity + (usedByType["maternity"] || 0) },
        }
      });
      return;
    }

    if (role === "super_admin") {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const [totalWorkforce, onLeaveTodayLeaves, pendingActions, totalDepartments] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Leave.find({ status: "approved", startDate: { $lte: todayStart }, endDate: { $gte: todayStart } }).populate("employeeId", "name email avatar").lean(),
        Leave.countDocuments({ status: "pending", createdAt: { $lte: threeDaysAgo } }),
        User.distinct("departmentId").then(ids => ids.filter(id => id != null).length) // Hacky way to get dept count without Dept model access if not imported
      ]);
      const onLeaveToday = onLeaveTodayLeaves.length;
      
      // Calculate global leave rate
      const globalLeaveRate = totalWorkforce > 0 ? ((onLeaveToday / totalWorkforce) * 100).toFixed(1) : 0;

      // Also fetch super admin's own leave balance
      const user = await User.findById(id).select("leaveBalance");
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const approvedLeaves = await Leave.find({ employeeId: id, status: "approved", startDate: { $gte: yearStart } }).select("leaveType").lean();
      const usedByType: Record<string, number> = {};
      for (const l of approvedLeaves) {
        usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + 1;
      }
      const lb = user?.leaveBalance || { annual: 0, sick: 0, casual: 0, maternity: 0 };

      res.json({
        totalWorkforce,
        globalLeaveRate: Number(globalLeaveRate),
        onLeaveToday,
        onLeaveEmployees: onLeaveTodayLeaves.map((l: any) => ({
          ...l.employeeId,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate
        })),
        pendingActions,
        departmentsConfigured: totalDepartments,
        leaveBalances: {
          annual:    { remaining: lb.annual,    total: lb.annual    + (usedByType["annual"] || 0) },
          sick:      { remaining: lb.sick,      total: lb.sick      + (usedByType["sick"] || 0) },
          casual:    { remaining: lb.casual,    total: lb.casual    + (usedByType["casual"] || 0) },
          maternity: { remaining: lb.maternity, total: lb.maternity + (usedByType["maternity"] || 0) },
        }
      });
      return;
    }

    res.status(400).json({ message: "Unrecognized role." });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};


export const getTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    let matchQuery: any = { status: "approved" };

    if (role === "employee") {
      matchQuery.employeeId = id;
    } else if (role === "supervisor") {
      const reportees = await User.find({ supervisorId: id }).select("_id");
      matchQuery.employeeId = { $in: reportees.map(u => u._id) };
    } else if (role === "admin") {
      const actor = await User.findById(id).select("departmentId");
      if (!actor?.departmentId) {
        res.status(403).json({ message: "Admin must belong to a department" });
        return;
      }
      const deptUsers = await User.find({ departmentId: actor.departmentId }).select("_id");
      matchQuery.employeeId = { $in: deptUsers.map(u => u._id) };
    }

    const trends = await Leave.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $month: "$startDate" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format output e.g. { "Jan": 5, "Feb": 2 }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrends = trends.map(t => ({ month: months[t._id - 1], count: t.count }));

    res.json(formattedTrends);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};


export const getDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    let matchQuery: any = { status: "approved" };

    // Similar filtering as trends
    if (role === "employee") {
      matchQuery.employeeId = id;
    } else if (role === "supervisor") {
      const reportees = await User.find({ supervisorId: id }).select("_id");
      matchQuery.employeeId = { $in: reportees.map(u => u._id) };
    } else if (role === "admin") {
      const actor = await User.findById(id).select("departmentId");
      if (!actor?.departmentId) {
        res.status(403).json({ message: "Admin must belong to a department" });
        return;
      }
      const deptUsers = await User.find({ departmentId: actor.departmentId }).select("_id");
      matchQuery.employeeId = { $in: deptUsers.map(u => u._id) };
    } else if (role === "super_admin") {
       // For super admin, group by department instead of leave type as per spec
       const deptDist = await Leave.aggregate([
         { $match: { status: "approved" } },
         { $lookup: { from: "users", localField: "employeeId", foreignField: "_id", as: "user" } },
         { $unwind: "$user" },
         { $lookup: { from: "departments", localField: "user.departmentId", foreignField: "_id", as: "department" } },
         { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
         {
           $group: {
             _id: "$department.name",
             count: { $sum: 1 }
           }
         }
       ]);
       res.json(deptDist.map(d => ({ label: d._id || "No Department", count: d.count })));
       return;
    }

    const distribution = await Leave.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$leaveType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(distribution.map(d => ({ label: d._id, count: d.count })));
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getActivityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    
    // Simple logic: Super Admin sees global notifications (userId: null)
    // Others see their specific notifications
    const query = role === "super_admin" ? { userId: null } : { userId: id };

    const activities = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
