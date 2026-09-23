import { Request, Response, NextFunction } from "express";
import { AppError } from "../../domain/errors/AppError";
import { WeakPasswordError } from "../../domain/errors/WeakPasswordError";

function mapPasswordFailuresToMessage(failures: string[]): string {
  const hasDefaultPolicyFailures = failures.some((failure) =>
    ["minimumLength", "uppercase", "lowercase", "number", "specialCharacter"].includes(failure)
  );

  if (hasDefaultPolicyFailures) {
    return "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
  }

  if (failures.includes("noSpaces")) {
    return "Password cannot contain spaces.";
  }

  return "Password does not meet security requirements.";
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof WeakPasswordError) {
    res.status(400).json({ error: mapPasswordFailuresToMessage(err.failures) });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal server error" });
}