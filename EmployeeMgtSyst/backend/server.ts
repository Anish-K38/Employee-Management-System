// Force Node.js to use Google DNS directly — bypasses the system resolver
// which refuses SRV record lookups required by mongodb+srv:// URIs.
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { bootstrapSuperAdmin } from "./config/bootstrap.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await bootstrapSuperAdmin(); // Create default super_admin on first run

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

startServer();