import { z } from "zod";
import { AppConfig } from "../../domain/config/AppConfig";

const envSchema = z.object({
  DATABASE_PATH: z.string().default("database.sqlite"),
  JWT_SECRET: z.string().default("PATRICKJWT"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment configuration.");
}

export const config = _env.data;