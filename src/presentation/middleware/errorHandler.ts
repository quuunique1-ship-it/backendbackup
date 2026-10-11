import { Request, Response, NextFunction } from "express";
import { AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../domain/errors/AppError";
import { WeakPasswordError } from "../../domain/errors/WeakPasswordError";
import { mapPasswordFailuresToMessage } from "../helpers/passwordErrorPresenter";
import { logger } from "../../infrastructure/logging/PinoLogger.js";

export function mapDomainErrorToHttpStatus(err: AppError): number {
  if (err instanceof WeakPasswordError) return 400;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof ForbiddenError) return 403;
  if (err instanceof ConflictError) return 409;
  if (err instanceof ValidationError) return 400;
  return 400;
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
    res.status(mapDomainErrorToHttpStatus(err)).json({ error: err.message });
    return;
  }

  logger.error({ err, path: _req.path, method: _req.method }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
}