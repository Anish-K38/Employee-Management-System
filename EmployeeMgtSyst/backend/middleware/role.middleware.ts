import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types/express.js";
import { User } from "../models/user.js";

// Role hierarchy — higher index = more authority
// employee(0) → supervisor(1) → admin(2) → super_admin(3)
const ROLE_HIERARCHY: UserRole[] = [
  "employee",
  "supervisor",
  "admin",
  "super_admin",
];


export const authorize = (...requiredRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized, user not found on request" });
      return;
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(req.user.role);

    const hasAccess = requiredRoles.some(
      (required) => userRoleIndex >= ROLE_HIERARCHY.indexOf(required)
    );

    if (!hasAccess) {
      res.status(403).json({
        message: `Access denied. Requires one of: [${requiredRoles.join(", ")}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

// Creation permission matrix:
//   super_admin - can create: admin, supervisor, employee
//   admin       - can create: supervisor, employee  (own dept only — enforced in controller)
//   supervisor  - cannot create users
//   employee    - cannot create users
const CREATION_RULES: Partial<Record<UserRole, UserRole[]>> = {
  super_admin: ["admin", "supervisor", "employee"],
  admin: ["supervisor", "employee"],
};


export const authorizeCreation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authorized, user not found on request" });
    return;
  }

  const actorRole = req.user.role;
  const targetRole: UserRole = req.body.role || "employee";

  const allowedTargets = CREATION_RULES[actorRole];

  if (!allowedTargets) {
    res.status(403).json({
      message: `Access denied. Your role (${actorRole}) is not permitted to create users.`,
    });
    return;
  }

  if (!allowedTargets.includes(targetRole)) {
    res.status(403).json({
      message: `Access denied. A ${actorRole} cannot create a user with role "${targetRole}". Allowed: [${allowedTargets.join(", ")}]`,
    });
    return;
  }

  if (actorRole === "admin") {
    try {
      const actorInDb = await User.findById(req.user.id).select("departmentId");

      if (!actorInDb || !actorInDb.departmentId) {
        res.status(403).json({
          message: "Admin must belong to a department before creating users.",
        });
        return;
      }

      // Overwrite whatever departmentId the caller sent — admin can only create within their dept
      req.body.departmentId = actorInDb.departmentId.toString();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server Error" });
      return;
    }
  }

  next();
};
