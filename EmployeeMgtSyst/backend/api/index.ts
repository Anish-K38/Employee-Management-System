import app from "../app.js";
import { connectDB } from "../config/db.js";

// Vercel Serverless Function entry point
// Connect to the database
connectDB();

export default app;
