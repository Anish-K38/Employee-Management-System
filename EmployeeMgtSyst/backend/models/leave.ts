import mongoose from "mongoose";

export interface ILeave extends mongoose.Document {
  employeeId: mongoose.Types.ObjectId;
  leaveType: "annual" | "sick" | "casual" | "maternity" | "paternity" | "unpaid";
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason?: string;

  // Stage 1 — Supervisor
  supervisorApproval: "pending" | "approved" | "rejected" | "not_required";
  supervisorId?: mongoose.Types.ObjectId;   // who acted
  supervisorRemark?: string;                // reason / note

  // Stage 2 — Admin
  adminApproval: "pending" | "approved" | "rejected" | "not_required";
  adminId?: mongoose.Types.ObjectId;        // who acted
  adminRemark?: string;                     // reason / note

  // Stage 3 — Super Admin
  superAdminApproval: "pending" | "approved" | "rejected" | "not_required";
  superAdminId?: mongoose.Types.ObjectId;   // who acted
  superAdminRemark?: string;                // reason / note
}

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["annual", "sick", "casual", "maternity", "paternity", "unpaid"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Stage 1: Supervisor ──────────────────────
    supervisorApproval: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "pending",
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    supervisorRemark: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Stage 2: Admin ───────────────────────────
    adminApproval: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "pending",
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminRemark: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Stage 3: Super Admin ─────────────────────
    superAdminApproval: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
    },

    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    superAdminRemark: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Leave = mongoose.model<ILeave>("Leave", leaveSchema);
