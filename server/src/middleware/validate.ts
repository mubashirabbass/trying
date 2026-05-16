import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../lib/auth";

/**
 * Middleware to validate request body, query, and params against a Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isRequestSchema = schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params);
      const dataToValidate = isRequestSchema ? { body: req.body, query: req.query, params: req.params } : req.body;

      const parsed = await schema.parseAsync(dataToValidate);
      
      if (isRequestSchema) {
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
        if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      } else {
        req.body = parsed;
      }
      
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
