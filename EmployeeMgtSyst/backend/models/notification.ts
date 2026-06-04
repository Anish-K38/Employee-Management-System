import mongoose from "mongoose";

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId | null; // null means global broadcast to super_admins
  message: string;
  type: "leave_approved" | "leave_rejected" | "leave_requested" | "system_alert";
  isRead: boolean;
  relatedLeaveId?: mongoose.Types.ObjectId;
}

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // If null, this could represent a global notification
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["leave_approved", "leave_rejected", "leave_requested", "system_alert"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedLeaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
