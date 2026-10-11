import { Request, Response, NextFunction } from "express";
import { AppError, UnauthorizedError, ForbiddenError } from "../../domain/errors/AppError.js";
import { UserRole } from "../../domain/entities/User.js";
import { AuthorizationPolicy } from "../../domain/policies/AuthorizationPolicy.js";
import { TokenVerifier } from "../../domain/ports/TokenVerifier.js";
import { DefaultAuthorizationPolicy } from "../../infrastructure/policies/DefaultAuthorizationPolicy.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  teamId?: string | null;
}

export function authMiddleware(tokenVerifier: TokenVerifier) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Authentication token missing or invalid"));
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = tokenVerifier.verify(token);
      req.userId = decoded.userId;
      req.userRole = decoded.role ?? "user";
      req.teamId = decoded.teamId ?? null;
      next();
    } catch (_err) {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  const authorizationPolicy: AuthorizationPolicy = new DefaultAuthorizationPolicy();

  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !authorizationPolicy.canAccess(req.userRole, roles)) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }
    next();
  };
}