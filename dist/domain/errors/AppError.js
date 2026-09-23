"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(404, message);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message);
    }
}
exports.ValidationError = ValidationError;
