import { z } from "zod";

export const CreateTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ message: "Title is required" })
      .min(1, "Title cannot be empty")
      .max(100, "Title cannot exceed 100 characters")
      .trim(),
    ownerId: z.string().trim().optional(),
  }),
});

export const PaginationQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => !isNaN(val) && val >= 1, {
        message: "Limit must be a positive number",
      }),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .refine((val) => !isNaN(val) && val >= 0, {
        message: "Offset must be a non-negative number",
      }),
  }),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>["body"];
export type PaginationQueryDTO = z.infer<typeof PaginationQuerySchema>["query"];