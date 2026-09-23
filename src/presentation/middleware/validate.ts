import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { ValidationError } from "../../domain/errors/AppError";

export const validate =
  (schema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues[0];
        next(new ValidationError(issue ? issue.message : "Invalid request data"));
      } else {
        next(error);
      }
    }
  };