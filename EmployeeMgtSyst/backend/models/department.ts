import mongoose from "mongoose";

export interface IDepartment extends mongoose.Document {
  name: string;
  description?: string;
}

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>(
  "Department",
  departmentSchema
);
