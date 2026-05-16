import "./preload";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT) || 8080;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

console.log("SERVER ENTRY POINT REACHED");
logger.info("Starting server...");
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info(`Database URL set: ${!!process.env.DATABASE_URL}`);
logger.info(`JWT Secret set: ${!!process.env.JWT_SECRET}`);

// Environment Variable Validation
const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  logger.error(`FATAL: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server listening on port ${port} (0.0.0.0)`);
});
