import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables immediately
const rootEnv = path.resolve(process.cwd(), ".env");
const serverEnv = path.resolve(process.cwd(), "../.env");
const envPath = fs.existsSync(rootEnv) ? rootEnv : fs.existsSync(serverEnv) ? serverEnv : null;

if (envPath) {
  dotenv.config({ path: envPath });
}
