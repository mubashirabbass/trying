
async function fetchBranches() {
  const url = "http://127.0.0.1:8080/api/branches";
  console.log("Fetching from:", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Data sample:", JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

fetchBranches();
