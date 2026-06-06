import bcrypt from "bcryptjs";
import { User } from "../models/user.js";


export const bootstrapSuperAdmin = async (): Promise<void> => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });

    if (existingSuperAdmin) return; 

    const DEFAULT_EMAIL = "director@company.com";
    const DEFAULT_PASSWORD = "admin123";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    await User.create({
      name: "Director",
      email: DEFAULT_EMAIL,
      password: hashedPassword,
      role: "super_admin",
      mustChangePassword: true,
      isActive: true,
    });

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║         LEAVEFLOW — FIRST RUN BOOTSTRAP          ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  Default Super Admin created                      ║`);
    console.log(`║  Email   : ${DEFAULT_EMAIL.padEnd(38)}║`);
    console.log(`║  Password: ${DEFAULT_PASSWORD.padEnd(38)}║`);
    console.log("║  ⚠  Change this password immediately on login    ║");
    console.log("╚══════════════════════════════════════════════════╝\n");
  } catch (error: any) {
    console.error("Bootstrap error:", error.message || error);
  }
};
