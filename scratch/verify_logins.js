
async function testLogin(email, password) {
  try {
    const response = await fetch("http://127.0.0.1:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    console.log(`Login ${email}: ${response.status}`, data.user ? `(Success: ${data.user.role})` : `(Fail: ${data.error})`);
  } catch (error) {
    console.error(`Error ${email}:`, error.message);
  }
}

async function runTests() {
  console.log("Verifying Logins (using 127.0.0.1)...");
  await testLogin("admin@gmail.com", "password123");
  await testLogin("haider@gmail.com", "password123");
  await testLogin("test@example.com", "password123");
  await testLogin("muntazir@gmail.com", "password123");
}

runTests();
