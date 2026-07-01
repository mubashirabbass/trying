// Intercept native fetch to rewrite paths to VITE_API_URL in production
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" 
    ? input 
    : (input instanceof URL ? input.toString() : input.url);
    
  const baseUrl = (import.meta.env.VITE_API_URL as string) || "";
  
  if (baseUrl && baseUrl !== "/api") {
    if (url.startsWith("/api")) {
      url = `${baseUrl.replace(/\/$/, "")}${url}`;
    } else if (url.startsWith(`${window.location.origin}/api`)) {
      url = url.replace(window.location.origin, baseUrl.replace(/\/$/, ""));
    } else if (url.startsWith("/uploads")) {
      url = `${baseUrl.replace(/\/$/, "")}${url}`;
    } else if (url.startsWith(`${window.location.origin}/uploads`)) {
      url = url.replace(window.location.origin, baseUrl.replace(/\/$/, ""));
    }
  }

  if (typeof input === "string") {
    return originalFetch(url, init);
  } else if (input instanceof URL) {
    return originalFetch(new URL(url), init);
  } else {
    return originalFetch(new Request(url, input), init);
  }
};

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);