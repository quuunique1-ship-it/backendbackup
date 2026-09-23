"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../../infrastructure/config/env.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
function authMiddleware(userRepository) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError_js_1.AppError(401, "Authentication token missing or invalid"));
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.JWT_SECRET);
            if (!decoded || typeof decoded !== "object" || typeof decoded.userId !== "string") {
                throw new AppError_js_1.AppError(401, "Invalid token payload");
            }
            const user = await userRepository.findById(decoded.userId);
            if (!user) {
                next(new AppError_js_1.AppError(401, "Authenticated user no longer exists"));
                return;
            }
            req.userId = user.id;
            req.userRole = user.role;
            req.teamId = user.teamId;
            req.currentUser = user;
            next();
        }
        catch (err) {
            next(err instanceof AppError_js_1.AppError ? err : new AppError_js_1.AppError(401, "Invalid or expired token"));
        }
    };
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.currentUser || !roles.includes(req.currentUser.role)) {
            next(new AppError_js_1.AppError(403, "You do not have permission to perform this action"));
            return;
        }
        next();
    };
}
