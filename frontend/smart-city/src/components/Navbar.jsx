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

  const username = user?.username || user?.name || user?.email || "";
  const role = user && user.role ? user.role.toLowerCase() : "";

  useEffect(() => {
    const refreshFromStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          const u = parsed.user || parsed;
          if (u && u.role) u.role = u.role.toString().toLowerCase();
          setUser(u);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("authChanged", refreshFromStorage);
    refreshFromStorage();

    return () => {
      window.removeEventListener("storage", refreshFromStorage);
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

  const getLinkClass = (path) => {
    return pathname === path ? "nav-link active" : "nav-link";
  };

  return (
    <header className="site-navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand">
          <span className="brand-icon">🏙️</span>
          <span className="brand-title">CityPortal</span>
        </Link>

        {/* Center Links */}
        <nav className="nav-menu">
          <Link to="/" className={getLinkClass("/")}>
            Home
          </Link>

          {user && role !== "admin" && (
            <>
              <Link to="/report" className={getLinkClass("/report")}>
                Report Issue
              </Link>
              <Link to="/track" className={getLinkClass("/track")}>
                Track
              </Link>
            </>
          )}

          {user && role === "admin" && (
            <Link to="/admin" className={getLinkClass("/admin")}>
              Admin Panel
            </Link>
          )}

          <Link to="/all-reports" className={getLinkClass("/all-reports")}>
            Community Dashboard
          </Link>
        </nav>

        {/* Right Auth Buttons */}
        <div className="nav-right">
          {!user ? (
            <div className="auth-btns">
              <Link to="/login" className="nav-btn nav-btn-primary">
                Login
              </Link>
              <Link to="/register" className="nav-btn nav-btn-secondary">
                Register
              </Link>
            </div>
          ) : (
            <div className="user-box">
              <span className="user-name">
                {username} ({role})
              </span>
              <button onClick={handleLogout} className="nav-btn nav-btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
