// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  console.log(JSON.parse(localStorage.getItem("user")));

  const loginTimeOut = JSON.parse(localStorage.getItem("user"));

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        {/* --------------------------------------------
            CASE 1 → USER NOT LOGGED IN
        -------------------------------------------- */}
        {!loginTimeOut && (
          <>
            <h1 className="home-title">Welcome</h1>

            <p className="home-description">
              You are not logged in. Please login to continue or register if you
              are new.
            </p>

            <div className="home-btn-group">
              <button
                onClick={() => navigate("/login")}
                className="btn login-btn"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/register")}
                className="btn register-btn"
              >
                Register
              </button>
            </div>
          </>
        )}

        {/* --------------------------------------------
            CASE 2 → USER LOGGED IN
        -------------------------------------------- */}
        {loginTimeOut && (
          <>
            <h1 className="home-title">Welcome Back</h1>
            <p className="home-description">
              Hello <strong>{loginTimeOut.username}</strong>, you are logged in.
            </p>
            <div className="home-btn-group">
              {loginTimeOut.role === "citizen" && (
                <button
                  onClick={() => navigate("/track")}
                  className="btn login-btn"
                >
                  View Your Complaints
                </button>
              )}

              {loginTimeOut.role === "admin" && (
                <button
                  onClick={() => navigate("/all-reports")}
                  className="btn login-btn"
                >
                  View Your Complaints
                </button>
              )}

              <button onClick={handleLogout} className="btn register-btn">
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
