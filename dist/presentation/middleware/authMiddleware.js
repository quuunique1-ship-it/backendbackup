"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const AppError_js_1 = require("../../domain/errors/AppError.js");
const DefaultAuthorizationPolicy_js_1 = require("../../infrastructure/policies/DefaultAuthorizationPolicy.js");
function authMiddleware(tokenVerifier) {
    return (req, _res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError_js_1.UnauthorizedError("Authentication token missing or invalid"));
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = tokenVerifier.verify(token);
            req.userId = decoded.userId;
            req.userRole = decoded.role ?? "user";
            req.teamId = decoded.teamId ?? null;
            next();
        }
        catch (_err) {
            next(new AppError_js_1.UnauthorizedError("Invalid or expired token"));
        }
    };
}
function requireRole(...roles) {
    const authorizationPolicy = new DefaultAuthorizationPolicy_js_1.DefaultAuthorizationPolicy();
    return (req, _res, next) => {
        if (!req.userRole || !authorizationPolicy.canAccess(req.userRole, roles)) {
            next(new AppError_js_1.ForbiddenError("You do not have permission to perform this action"));
            return;
        }
        next();
    };
}
