// src/pages/Login.jsx (minor edits to notify navbar + persist user)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../auth/AuthContext"; // NEW (kept)
import axios from "axios";

const API_BASE = "http://localhost:5004/city-api/citizen";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleChoice, setRoleChoice] = useState("citizen");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth(); // USE CONTEXT if available

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // indicate login is in progress so Navbar hides links
      try {
        localStorage.setItem("auth_in_progress", "1");
        window.dispatchEvent(new Event("authChanged"));
      } catch (err) {
        // ignore localStorage errors
      }

      const endpoint = roleChoice === "admin" ? "/admin" : "/login";
      const body = { username: emailOrUsername, password };

      const res = await api.post(endpoint, body);

      // adapt to your backend response
      const returned = res.data?.UserData || res.data?.user || res.data;
      const token = res.data?.token || res.data?.accessToken || null;

      if (returned) {
        // ----- Minimal change: normalize and persist user, notify BEFORE navigation -----
        const safeUser = {
          _id: returned._id || returned.id || null,
          username:
            returned.username ||
            returned.email ||
            returned.name ||
            emailOrUsername,
          // ensure role is always a lowercase string: "admin" or "citizen"
          role: (returned.role || roleChoice || "citizen")
            .toString()
            .toLowerCase(),
        };

        try {
          // persist normalized user object (plain object)
          localStorage.setItem("user", JSON.stringify(safeUser));
          if (token) localStorage.setItem("token", token);
        } catch (err) {
          // ignore localStorage write errors
        }

        // update AuthContext if present
        try {
          if (typeof login === "function") login(safeUser, token);
        } catch (err) {
          // ignore
        }

        // remove in-progress flag and notify listeners BEFORE navigation
        try {
          localStorage.removeItem("auth_in_progress");
          window.dispatchEvent(new Event("authChanged"));
        } catch (err) {}

        // now navigate (Navbar has already been notified)
        navigate(safeUser.role === "admin" ? "/admin" : "/report");
        // -------------------------------------------------------------------------------
      } else {
        // no user returned
        try {
          localStorage.removeItem("auth_in_progress");
          window.dispatchEvent(new Event("authChanged"));
        } catch (err) {}
        setError("Login failed: no user returned from server.");
      }
    } catch (err) {
      // clear flag on error and notify navbar
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
        <h2>Login</h2>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Username</label>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Login as:</label>
            <select
              value={roleChoice}
              onChange={(e) => setRoleChoice(e.target.value)}
            >
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
