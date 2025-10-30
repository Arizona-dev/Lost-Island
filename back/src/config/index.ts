import "dotenv/config";
import mongoose from "mongoose";
import logger from "../utils/logger";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI environment variable is not set. Please check your .env file."
      );
    }

    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected successfully");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to connect to MongoDB: ${errorMessage}`);
    process.exit(1);
  }
};
