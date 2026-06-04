import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser } from "./api/userApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logoutRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCurrentUser(token)
      .then((u) => {
        if (!cancelled) {
          setUser(u);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("authToken");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
  };

  // Синхронизируем ref, чтобы слушатель события видел актуальный logout
  logoutRef.current = logout;

  // Авто-логаут при получении 401 от любого API-запроса
  useEffect(() => {
    const handleUnauthorized = () => {
      if (localStorage.getItem("authToken")) {
        logoutRef.current();
      }
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const value = {
    token,
    user,
    loading,
    error,
    login,
    logout,
    setUser,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

