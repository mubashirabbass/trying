import bcrypt from "bcryptjs";

async function test() {
  const password = "password123";
  const hash = "$2b$12$CNHQbPFVnDJ6lIKPKvwfVufqYPqDggwFMsH6wC6mfR2R7ZnnpeVGW";
  
  console.log("Testing bcryptjs...");
  try {
    const result = await bcrypt.compare(password, hash);
    console.log("Result:", result);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
