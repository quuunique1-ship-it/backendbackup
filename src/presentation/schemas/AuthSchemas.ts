import { z } from "zod";

export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["user", "leader"]).default("user"),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().min(1, "Email or username is required"),
    password: z.string().min(1),
  }),
});