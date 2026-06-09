import app from "../app.js";
import { connectDB } from "../config/db.js";

import { bootstrapSuperAdmin } from "../config/bootstrap.js";

// Vercel Serverless Function entry point
// Connect to the database and ensure the super admin exists
connectDB().then(() => {
  bootstrapSuperAdmin();
});

export default app;
