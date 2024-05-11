import mongoose from "mongoose";
import logger from "../utils/logger";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://galermonpagos:c6OUzNJqVSCY03G8@cluster0.no2lp30.mongodb.net/?retryWrites=true&w=majority"
    );
    logger.info("MongoDB connected");
  } catch (error: any) {
    logger.error(error);
    process.exit(1);
  }
};
