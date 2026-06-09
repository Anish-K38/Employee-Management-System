import app from "../app.js";
import { connectDB } from "../config/db.js";

import { bootstrapSuperAdmin } from "../config/bootstrap.js";

// Vercel Serverless Function entry point
export default async function handler(req: any, res: any) {
  // Ensure we are connected to the database before handling the request
  await connectDB();
  
  // Run bootstrap in the background (fire and forget)
  bootstrapSuperAdmin().catch(console.error);
  
  // Pass the request to the Express app
  return app(req, res);
}
