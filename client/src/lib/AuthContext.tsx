import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize API client
// If VITE_API_URL is "/api", we want to use relative paths for the Vite proxy to work correctly.
// Prepending "/api" to "/api/courses" results in "/api/api/courses".
if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "/api") {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Register token getter for customFetch
    setAuthTokenGetter(() => {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    });

    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.id || !token) return;

    const sendHeartbeat = () => {
      fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 20000);
    const onVisible = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id, token]);

  const login = (newUser: User, newToken: string, rememberMe: boolean = false) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", newToken);
    storage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    const currentUserId = user?.id;
    const currentToken = token;
    if (currentUserId && currentToken) {
      fetch("/api/presence/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ userId: currentUserId }),
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  const refreshUser = async () => {
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        
        // Update storage
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
