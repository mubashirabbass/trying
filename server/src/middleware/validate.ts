import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../lib/auth";

/**
 * Middleware to validate request body, query, and params against a Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Update request with validated and transformed data
      // NOTE: req.query is getter-only in Node.js v24+ — use Object.assign to mutate in-place
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return next(new AppError(message, 400));
      }
      next(error);
    }
  };
};
