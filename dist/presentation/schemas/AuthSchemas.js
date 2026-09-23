"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().toLowerCase().email(),
        password: zod_1.z.string().min(6),
        role: zod_1.z.enum(["user", "leader"]).default("user"),
    }),
});
exports.LoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().toLowerCase().min(1, "Email or username is required"),
        password: zod_1.z.string().min(1),
    }),
});
