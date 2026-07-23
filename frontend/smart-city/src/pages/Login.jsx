// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import { API_BASE } from "../config";

const API_BASE_CITIZEN = `${API_BASE}/city-api/citizen`;
const api = axios.create({ baseURL: API_BASE_CITIZEN, withCredentials: true });

const Login = ({ isAdmin: isAdminProp }) => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check if current route is admin login
  const isAdminMode = isAdminProp || location.pathname === "/admin-login";
  const roleChoice = isAdminMode ? "admin" : "citizen";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      try {
        localStorage.setItem("auth_in_progress", "1");
        window.dispatchEvent(new Event("authChanged"));
      } catch (err) {}

      const endpoint = isAdminMode ? "/admin" : "/login";
      const body = { username: emailOrUsername, password };

      const res = await api.post(endpoint, body);

      const returned = res.data?.UserData || res.data?.user || res.data;
      const token = res.data?.token || res.data?.accessToken || null;

      if (returned) {
        const safeUser = {
          _id: returned._id || returned.id || null,
          username:
            returned.username ||
            returned.email ||
            returned.name ||
            emailOrUsername,
          role: (returned.role || roleChoice).toString().toLowerCase(),
        };

        try {
          localStorage.setItem("user", JSON.stringify(safeUser));
          if (token) localStorage.setItem("token", token);
        } catch (err) {}

        try {
          if (typeof login === "function") login(safeUser, token);
        } catch (err) {}

        try {
          localStorage.removeItem("auth_in_progress");
          window.dispatchEvent(new Event("authChanged"));
        } catch (err) {}

        navigate(safeUser.role === "admin" ? "/admin" : "/report");
      } else {
        try {
          localStorage.removeItem("auth_in_progress");
          window.dispatchEvent(new Event("authChanged"));
        } catch (err) {}
        setError("Login failed: no user returned from server.");
      }
    } catch (err) {
      try {
        localStorage.removeItem("auth_in_progress");
        window.dispatchEvent(new Event("authChanged"));
      } catch (e) {}

      setError(
        err.response?.data?.message || "Login failed. Check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{isAdminMode ? "🛡️ Admin Login" : "Citizen Login"}</h2>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Username</label>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder={isAdminMode ? "Enter admin username" : "Enter username"}
              required
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading
              ? "Logging in..."
              : isAdminMode
              ? "Login to Admin Portal"
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
