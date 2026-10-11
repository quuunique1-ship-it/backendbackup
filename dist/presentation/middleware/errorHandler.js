"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDomainErrorToHttpStatus = mapDomainErrorToHttpStatus;
exports.errorHandler = errorHandler;
const AppError_1 = require("../../domain/errors/AppError");
const WeakPasswordError_1 = require("../../domain/errors/WeakPasswordError");
const passwordErrorPresenter_1 = require("../helpers/passwordErrorPresenter");
const PinoLogger_js_1 = require("../../infrastructure/logging/PinoLogger.js");
function mapDomainErrorToHttpStatus(err) {
    if (err instanceof WeakPasswordError_1.WeakPasswordError)
        return 400;
    if (err instanceof AppError_1.NotFoundError)
        return 404;
    if (err instanceof AppError_1.UnauthorizedError)
        return 401;
    if (err instanceof AppError_1.ForbiddenError)
        return 403;
    if (err instanceof AppError_1.ConflictError)
        return 409;
    if (err instanceof AppError_1.ValidationError)
        return 400;
    return 400;
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof WeakPasswordError_1.WeakPasswordError) {
        res.status(400).json({ error: (0, passwordErrorPresenter_1.mapPasswordFailuresToMessage)(err.failures) });
        return;
    }
    if (err instanceof AppError_1.AppError) {
        res.status(mapDomainErrorToHttpStatus(err)).json({ error: err.message });
        return;
    }
    PinoLogger_js_1.logger.error({ err, path: _req.path, method: _req.method }, "Unhandled request error");
    res.status(500).json({ error: "Internal server error" });
}
