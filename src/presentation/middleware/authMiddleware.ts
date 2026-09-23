import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../infrastructure/config/env.js";
import { AppError } from "../../domain/errors/AppError.js";
import { UserRole } from "../../domain/entities/User.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  teamId?: string | null;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication token missing or invalid"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      role?: UserRole;
      teamId?: string | null;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role ?? "user";
    req.teamId = decoded.teamId ?? null;
    next();
  } catch (err) {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(new AppError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}