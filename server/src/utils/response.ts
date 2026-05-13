import { Response } from "express";

export interface StandardResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: any;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Standard success response helper
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
  pagination?: StandardResponse<T>["pagination"]
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
    pagination,
  });
};

/**
 * Standard error response helper
 */
export const sendError = (
  res: Response,
  message: string = "Error",
  statusCode: number = 500,
  error: any = null
) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
};
