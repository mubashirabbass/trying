import winston from "winston";
import "winston-daily-rotate-file";

/**
 * Production-grade Winston logger configuration
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "api-server" },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production"
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "error",
    }),
    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});
