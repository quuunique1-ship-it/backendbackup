"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const PinoLogger_js_1 = require("../logging/PinoLogger.js");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    DATABASE_PATH: zod_1.z.string().min(1, "DATABASE_PATH is required"),
    JWT_SECRET: zod_1.z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    APP_URL: zod_1.z.string().url("APP_URL must be a full URL"),
    PORT: zod_1.z.coerce.number().int().positive("PORT must be a positive integer"),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]),
    ADMIN_EMAIL: zod_1.z.string().email("ADMIN_EMAIL must be a valid email"),
    ADMIN_PASSWORD: zod_1.z.string().min(12, "ADMIN_PASSWORD must be at least 12 characters"),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    PinoLogger_js_1.logger.error({ validationErrors: _env.error.format() }, "Invalid environment variables");
    throw new Error("Invalid environment configuration.");
}
exports.config = _env.data;
