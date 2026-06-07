import type { Request, Response } from "express";
import { Department } from "../models/department.js";
import { User } from "../models/user.js";

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: "Department name is required" });
      return;
    }

    const deptExists = await Department.findOne({ name });
    if (deptExists) {
      res.status(400).json({ message: "A department with this name already exists" });
      return;
    }

    const department = await Department.create({
      name,
      description,
    });

    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    // Both super_admin and admin can fetch departments (admins need to see it for user creation)
    const departments = await Department.find({}).sort({ name: 1 });
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    if (name) {
      // Check if new name already exists elsewhere
      const existing = await Department.findOne({ name });
      if (existing && existing._id.toString() !== department._id.toString()) {
        res.status(400).json({ message: "A department with this name already exists" });
        return;
      }
      department.name = name;
    }

    if (description !== undefined) {
      department.description = description;
    }

    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    // Prevent deletion if users are assigned to this department
    const usersInDept = await User.countDocuments({ departmentId: req.params.id });
    if (usersInDept > 0) {
      res.status(400).json({ 
        message: `Cannot delete department. There are ${usersInDept} users assigned to it.` 
      });
      return;
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
