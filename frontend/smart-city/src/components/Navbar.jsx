// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [logoOk, setLogoOk] = useState(true);

  const username = user?.username || user?.name || user?.email || "";
  const role = user && user.role ? user.role.toLowerCase() : "";

  useEffect(() => {
    const parseStoredUser = (raw) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.user) return parsed.user;
        return parsed;
      } catch {
        return null;
      }
    };

    const refreshFromStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        const parsed = parseStoredUser(raw);
        if (parsed && parsed.role)
          parsed.role = parsed.role.toString().toLowerCase();
        setUser(parsed);
      } catch {
        setUser(null);
      }
    };

    const onStorage = (e) => {
      if (e.key === "user" || e.key === null) {
        refreshFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", refreshFromStorage);

    refreshFromStorage();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", refreshFromStorage);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_in_progress");
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  const LOGO_SRC = "/logo192.png";

  const getLinkClass = (path) => {
    return pathname === path ? "nav-link active" : "nav-link";
  };

  return (
    <header className="site-navbar">
      <div className="container nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand" aria-label="CityPortal home">
          {logoOk ? (
            <img
              src={LOGO_SRC}
              alt="CityPortal logo"
              className="brand-logo"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="brand-fallback" aria-hidden="true">
              <span className="brand-initial">C</span>
            </div>
          )}
          <div className="brand-titles">
            <span className="brand-text">CityPortal</span>
            <span className="brand-subtext">Smart Infrastructure</span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className={getLinkClass("/")}>
            <span className="nav-icon">🏠</span> Home
          </Link>

          {/* Links for Logged-In Citizens */}
          {user && role !== "admin" && (
            <>
              <Link to="/report" className={getLinkClass("/report")}>
                <span className="nav-icon">🚨</span> Report Issue
              </Link>
              <Link to="/track" className={getLinkClass("/track")}>
                <span className="nav-icon">📍</span> Track Complaints
              </Link>
            </>
          )}

          {/* Links for Logged-In Admin */}
          {user && role === "admin" && (
            <Link to="/admin" className={`${getLinkClass("/admin")} admin-link`}>
              <span className="nav-icon">🛡️</span> Admin Panel
            </Link>
          )}

          {/* Community Dashboard link - ALWAYS visible to everyone */}
          <Link to="/all-reports" className={getLinkClass("/all-reports")}>
            <span className="nav-icon">📊</span> Community Dashboard
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {!user ? (
            <div className="auth-buttons">
              <Link
                to="/login"
                className={`btn btn-login ${pathname === "/login" ? "active" : ""}`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`btn btn-register ${pathname === "/register" ? "active" : ""}`}
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="user-session">
              <div className="user-chip" title={username || "User"}>
                <span className="avatar">
                  {(username || "U").charAt(0).toUpperCase()}
                </span>
                <div className="user-info">
                  <div className="user-name">{username || "User"}</div>
                  <div className="user-role-badge">{role || "citizen"}</div>
                </div>
              </div>

              <button className="btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
