// src/components/Navbar.jsx (added conditional for login page)
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // NEW: useLocation added
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation(); // NEW
  // const user = localStorage.getItem("user");

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [authInProgress, setAuthInProgress] = useState(() => {
    try {
      return localStorage.getItem("auth_in_progress") === "1";
    } catch {
      return false;
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

      try {
        setAuthInProgress(localStorage.getItem("auth_in_progress") === "1");
      } catch {
        setAuthInProgress(false);
      }
    };

    const onStorage = (e) => {
      if (e.key === "user" || e.key === "auth_in_progress" || e.key === null) {
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

  // -----------------------------------------------------------
  // NEW: If on login page → show ONLY Home + Register
  // -----------------------------------------------------------
  if (pathname === "/login") {
    return (
      <header className="site-navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            {logoOk ? (
              <img
                src={LOGO_SRC}
                alt="CityPortal logo"
                className="brand-logo"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="brand-fallback">
                <span className="brand-initial">C</span>
              </div>
            )}
            <span className="brand-text">CityPortal</span>
          </Link>

          <nav className="nav-links">
            <Link to="/" className="nav-link" style={{ color: "black" }}>
              Home
            </Link>
            <Link
              to="/register"
              className="nav-link"
              style={{ color: "black" }}
            >
              Register
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // -----------------------------------------------------------

  return (
    <header className="site-navbar">
      <div className="container nav-inner">
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
          <span className="brand-text">CityPortal</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className="nav-link" style={{ color: "black" }}>
            Home
          </Link>

          {!authInProgress && (
            <>
              {role !== "admin" && user !== null && (
                <>
                  <Link
                    to="/report"
                    className="nav-link"
                    style={{ color: "black" }}
                  >
                    Report
                  </Link>
                  <Link
                    to="/track"
                    className="nav-link"
                    style={{ color: "black" }}
                  >
                    Track
                  </Link>
                </>
              )}

              {role === "admin" && user !== null && (
                <>
                  <Link
                    to="/admin"
                    className="nav-link admin"
                    style={{ color: "black" }}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/all-reports"
                    className="nav-link admin"
                    style={{ color: "black" }}
                  >
                    All Reports
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="nav-actions">
          {!user ? (
            authInProgress ? (
              <button className="btn primary" disabled>
                Logging in...
              </button>
            ) : (
              <Link to="/login" className="btn primary">
                Login
              </Link>
            )
          ) : (
            <>
              <div className="user-chip" title={username || "User"}>
                <span className="avatar">
                  {(username || "U").charAt(0).toUpperCase()}
                </span>
                <div className="user-info">
                  <div className="user-name">{username || "User"}</div>
                  <div className="user-role">{role || "citizen"}</div>
                </div>
              </div>

              <button className="btn ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
