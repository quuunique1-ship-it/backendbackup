"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
}
exports.ConflictError = ConflictError;
class AuthenticationError extends AppError {
}
exports.AuthenticationError = AuthenticationError;
