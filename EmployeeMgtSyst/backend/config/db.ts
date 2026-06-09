import mongoose from "mongoose";

// Global cache for serverless environments
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("Using cached MongoDB connection");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI!);
    isConnected = !!db.connections[0]?.readyState;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};