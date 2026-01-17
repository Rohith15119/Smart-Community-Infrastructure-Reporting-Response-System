// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

/**
 * AuthContext responsibilities:
 * - keep `user` and `token` in React state for immediate re-renders
 * - persist minimal data to localStorage for page reload persistence
 * - attach Authorization header to axios defaults when token present
 */

const AUTH_KEY = "user"; // keep same key you already used for compatibility

const api = axios.create({
  baseURL: "http://localhost:5004/city-api",
  withCredentials: true, // if your server uses cookies
});

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async (userObj, token) => {},
  logout: () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // initialize from localStorage (fast, no network)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || parsed);
        setToken(parsed.token || null);
        if (parsed.token) {
          api.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (e) {
      // ignore parse error
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // convenience: persist minimal data
  const persist = (u, t) => {
    const payload = { user: u, token: t };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist auth:", e);
    }
  };

  const login = (u, t) => {
    setUser(u);
    setToken(t || null);
    if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    else delete api.defaults.headers.common.Authorization;
    persist(u, t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem(AUTH_KEY);
  };

  // optional: refresh user from server using token (background)
  const refresh = async () => {
    if (!token) return null;
    try {
      const res = await api.get("/auth/me"); // adjust endpoint if needed
      const u = res.data.user || res.data;
      setUser(u);
      persist(u, token);
      return u;
    } catch (err) {
      console.debug("refresh failed", err?.message || err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refresh, api }}
    >
      {children}
    </AuthContext.Provider>
  );
}
