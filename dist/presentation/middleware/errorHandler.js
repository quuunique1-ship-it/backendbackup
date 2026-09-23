"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../../domain/errors/AppError");
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Internal server error" });
}
