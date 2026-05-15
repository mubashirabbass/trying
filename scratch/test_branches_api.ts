// Global fetch used

async function testBranchesApi() {
  const url = "http://127.0.0.1:8080/api/branches";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Data length:", Array.isArray(data) ? data.length : "Not an array");
    console.log("Data sample:", JSON.stringify(data, null, 2).slice(0, 500));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testBranchesApi().catch(console.error);
