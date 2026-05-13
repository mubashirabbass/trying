import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/auth";
import { logger } from "../lib/logger";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    logger.error(
      `API Error [${req.method} ${req.path}] ${err.statusCode}: ${err.message}\n${err.stack}`
    );

    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: don't leak stack traces
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      logger.error(`Internal Server Error: ${err.message}\n${err.stack}`);
      res.status(500).json({
        status: "error",
        message: "Something went very wrong!"
      });
    }
  }
};

export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
