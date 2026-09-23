import { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors/AppError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal server error" });
}