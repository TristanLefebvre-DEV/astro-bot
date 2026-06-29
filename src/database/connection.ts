import mongoose from "mongoose";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(config.DATABASE_URL, {
    serverSelectionTimeoutMS: 10_000
  });

  logger.info("MongoDB connecté");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB déconnecté");
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
