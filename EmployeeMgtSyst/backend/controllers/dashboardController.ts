import type { Request, Response } from "express";
import { Leave } from "../models/leave.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";

// ─────────────────────────────────────────────────────────────
// @desc    Get KPI stats for the logged-in user (role-aware)
// @route   GET /api/dashboard/kpis
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
export const getKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (role === "employee") {
      const user = await User.findById(id).select("leaveBalance");
      
      const [totalTaken, pendingRequests] = await Promise.all([
        Leave.countDocuments({ employeeId: id, status: "approved", startDate: { $gte: new Date(now.getFullYear(), 0, 1) } }),
        Leave.countDocuments({ employeeId: id, status: "pending" })
      ]);

      res.json({
        annualBalance: user?.leaveBalance?.annual || 0,
        sickBalance: user?.leaveBalance?.sick || 0,
        pendingRequests,
        totalTaken
      });
      return;
    }

    if (role === "supervisor") {
      const reportees = await User.find({ supervisorId: id }).select("_id");
      const reporteeIds = reportees.map((u) => u._id);

      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const [onLeaveToday, pendingReview, upcomingLeaves] = await Promise.all([
        Leave.countDocuments({ employeeId: { $in: reporteeIds }, status: "approved", startDate: { $lte: today }, endDate: { $gte: today } }),
        Leave.countDocuments({ employeeId: { $in: reporteeIds }, supervisorApproval: "pending", status: "pending" }),
        Leave.countDocuments({ employeeId: { $in: reporteeIds }, status: "approved", startDate: { $gt: today, $lte: nextWeek } })
      ]);

      res.json({
        teamMembers: reporteeIds.length,
        onLeaveToday,
        pendingReview,
        upcomingLeaves
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

      const today = new Date();
      today.setHours(0,0,0,0);

      const [onLeaveToday, pendingApprovals, rejectedThisMonth] = await Promise.all([
        Leave.countDocuments({ employeeId: { $in: deptUserIds }, status: "approved", startDate: { $lte: today }, endDate: { $gte: today } }),
        Leave.countDocuments({ employeeId: { $in: deptUserIds }, supervisorApproval: "approved", adminApproval: "pending" }),
        Leave.countDocuments({ employeeId: { $in: deptUserIds }, status: "rejected", updatedAt: { $gte: monthStart } })
      ]);

      res.json({
        departmentSize: deptUserIds.length,
        onLeaveToday,
        pendingApprovals,
        rejectedThisMonth
      });
      return;
    }

    if (role === "super_admin") {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const [totalWorkforce, onLeaveToday, pendingActions, totalDepartments] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Leave.countDocuments({ status: "approved", startDate: { $lte: today }, endDate: { $gte: today } }),
        Leave.countDocuments({ status: "pending", createdAt: { $lte: threeDaysAgo } }),
        User.distinct("departmentId").then(ids => ids.filter(id => id != null).length) // Hacky way to get dept count without Dept model access if not imported
      ]);
      
      // Calculate global leave rate
      const globalLeaveRate = totalWorkforce > 0 ? ((onLeaveToday / totalWorkforce) * 100).toFixed(1) : 0;

      res.json({
        totalWorkforce,
        globalLeaveRate: Number(globalLeaveRate),
        pendingActions,
        departmentsConfigured: totalDepartments
      });
      return;
    }

    res.status(400).json({ message: "Unrecognized role." });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get monthly leave trends (bar chart)
// @route   GET /api/dashboard/trends
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// @desc    Get leave type distribution (pie/doughnut chart)
// @route   GET /api/dashboard/distribution
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// @desc    Get activity feed / recent notifications
// @route   GET /api/dashboard/activity
// @access  Any authenticated user
// ─────────────────────────────────────────────────────────────
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
