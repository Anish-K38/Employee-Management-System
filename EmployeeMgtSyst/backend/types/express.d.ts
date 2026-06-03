import type { Request } from "express";

// Hierarchy (low → high): employee → supervisor → admin → super_admin
export type UserRole = "employee" | "supervisor" | "admin" | "super_admin";

export interface AuthPayload {
  id: string;
  role: UserRole;
}

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
