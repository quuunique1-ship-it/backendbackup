"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQuerySchema = exports.CreateTaskSchema = void 0;
const zod_1 = require("zod");
exports.CreateTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({ message: "Title is required" })
            .min(1, "Title cannot be empty")
            .max(100, "Title cannot exceed 100 characters")
            .trim(),
        ownerId: zod_1.z.string().trim().optional(),
    }),
});
exports.PaginationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 10))
            .refine((val) => !isNaN(val) && val >= 1, {
            message: "Limit must be a positive number",
        }),
        offset: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 0))
            .refine((val) => !isNaN(val) && val >= 0, {
            message: "Offset must be a non-negative number",
        }),
    }),
});
