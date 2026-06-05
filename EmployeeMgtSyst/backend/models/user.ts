import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "employee" | "supervisor" | "admin" | "super_admin";
  departmentId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;

  // Onboarding / security flags
  mustChangePassword: boolean;      // true when created by an admin; cleared on first password change
  passwordChangedAt?: Date;         // timestamp of last password change
  isActive: boolean;                // soft-disable without deleting the account

  // Leave & HR tracking
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    maternity: number;
  };
  joiningDate: Date;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["employee", "supervisor", "admin", "super_admin"],
      default: "employee",
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Onboarding & security flags ──────────────────────────
    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Leave & HR tracking ──────────────────────────────
    leaveBalance: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 5 },
      maternity: { type: Number, default: 0 },
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
