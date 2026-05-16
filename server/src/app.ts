import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error";

// Simple XSS sanitization middleware compatible with Node.js v24
const xssClean = () => {
  const clean = (data: any): any => {
    if (typeof data === "string") {
      return data
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }
    if (Array.isArray(data)) {
      return data.map(clean);
    }
    if (data !== null && typeof data === "object") {
      const cleaned: any = {};
      for (const key in data) {
        cleaned[key] = clean(data[key]);
      }
      return cleaned;
    }
    return data;
  };

  return (req: any, res: any, next: any) => {
    if (req.body) req.body = clean(req.body);
    if (req.query) Object.assign(req.query, clean(req.query));
    if (req.params) Object.assign(req.params, clean(req.params));
    next();
  };
};

const app: Express = express();

// 1. Core Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
})); // Enable CORS

// 2. Request Parsing & Sanitization
app.use(express.json({ limit: "10kb" })); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(xssClean()); // Data sanitization against XSS

// 3. Request Logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`${req.method} ${req.url}`);
  }
  next();
});

import path from "path";

// 4. API Routes (Versioned)
app.use("/api", router);

// 5. Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  
  app.get("*", (req, res) => {
    if (!req.url.startsWith("/api")) {
      res.sendFile(path.join(clientPath, "index.html"));
    }
  });
}

// 6. Global Error Handling
app.use(errorHandler);

export default app;
