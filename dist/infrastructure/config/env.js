"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_PATH: zod_1.z.string().default("database.sqlite"),
    JWT_SECRET: zod_1.z.string().default("PATRICKJWT"),
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    ADMIN_EMAIL: zod_1.z.string().email().default("admin@example.com"),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment configuration.");
}
exports.config = _env.data;
