
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

function createToken(userId: number, role: string): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "1h" });
}

async function testAuth() {
  const token = createToken(3, "student");
  console.log("Generated Token:", token);

  const url = "http://127.0.0.1:8080/api/notifications?userId=3";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testAuth();
