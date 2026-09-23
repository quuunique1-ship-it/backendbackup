"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../../domain/errors/AppError");
const validate = (schema) => async (req, _res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (parsed.body) {
            req.body = parsed.body;
        }
        if (parsed.query) {
            Object.assign(req.query, parsed.query);
        }
        if (parsed.params) {
            Object.assign(req.params, parsed.params);
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const issue = error.issues[0];
            next(new AppError_1.ValidationError(issue ? issue.message : "Invalid request data"));
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
