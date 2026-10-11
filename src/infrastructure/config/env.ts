import { z } from "zod";
import dotenv from "dotenv";
import { AppConfig } from "../../domain/config/AppConfig";
import { logger } from "../logging/PinoLogger.js";

dotenv.config();

const envSchema = z.object({
  DATABASE_PATH: z.string().min(1, "DATABASE_PATH is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  APP_URL: z.string().url("APP_URL must be a full URL"),
  PORT: z.coerce.number().int().positive("PORT must be a positive integer"),
  NODE_ENV: z.enum(["development", "production", "test"]),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASSWORD: z.string().min(12, "ADMIN_PASSWORD must be at least 12 characters"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error({ validationErrors: _env.error.format() }, "Invalid environment variables");
  throw new Error("Invalid environment configuration.");
}

export const config: AppConfig = _env.data as AppConfig;