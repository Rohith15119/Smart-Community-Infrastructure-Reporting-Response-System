// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  // Retrieve user session from localStorage
  const rawUser = localStorage.getItem("user");
  let user = null;
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      user = parsed.user || parsed;
    } catch (e) {
      user = null;
    }
  }

  const username = user?.username || "Citizen";
  const role = (user?.role || "citizen").toLowerCase();
  const isAdmin = role === "admin";

  return (
    <div className="home-page-wrap">
      {/* Top Banner Hero */}
      <header className="home-hero">
        <div className="hero-content">
          <span className="hero-badge">
            {isAdmin ? "🛡️ Admin Dashboard" : "📍 Smart City Portal"}
          </span>
          <h1 className="hero-title">
            Smart Community Infrastructure Response System
          </h1>
          <p className="hero-subtitle">
            {user
              ? `Welcome back, ${username}! Manage civic issues, track progress in real-time, and streamline community maintenance.`
              : "An end-to-end civic engagement platform empowering citizens to report infrastructure issues and tracking government response in real-time."}
          </p>

          {!user && (
            <div className="hero-cta-group">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/login")}
              >
                Login to Portal
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="home-main">
        {/* Quick Action Grid */}
        <section className="section-block">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-cards-grid">
            {!isAdmin && (
              <div
                className="action-card primary-card"
                onClick={() => navigate("/report")}
              >
                <div className="card-icon">🚨</div>
                <h3>Report Civic Issue</h3>
                <p>
                  Submit potholes, streetlight failures, drainage issues, or
                  water leakages with live GPS location.
                </p>
                <span className="card-link">File Report &rarr;</span>
              </div>
            )}

            {!isAdmin && (
              <div
                className="action-card"
                onClick={() => navigate("/track")}
              >
                <div className="card-icon">📍</div>
                <h3>Track My Complaints</h3>
                <p>
                  Monitor real-time resolution status and response updates for your
                  submitted reports.
                </p>
                <span className="card-link">View Track Status &rarr;</span>
              </div>
            )}

            {isAdmin && (
              <div
                className="action-card primary-card"
                onClick={() => navigate("/admin")}
              >
                <div className="card-icon">⚡</div>
                <h3>Admin Control Panel</h3>
                <p>
                  Review pending citizen complaints, assign resolution teams, and update
                  issue status.
                </p>
                <span className="card-link">Manage Complaints &rarr;</span>
              </div>
            )}

            <div
              className="action-card"
              onClick={() => navigate("/all-reports")}
            >
              <div className="card-icon">📊</div>
              <h3>Community Dashboard</h3>
              <p>
                View all public civic issues reported across the municipality for
                transparent governance.
              </p>
              <span className="card-link">Explore Reports &rarr;</span>
            </div>
          </div>
        </section>

        {/* System Architecture Highlights (Ideal for TCS Prime Interview explanation) */}
        <section className="section-block architecture-section">
          <h2 className="section-title">System Highlights & Architecture</h2>
          <p className="architecture-desc">
            Designed with a decoupled MERN stack architecture focusing on high performance, security, and scalability.
          </p>

          <div className="arch-grid">
            <div className="arch-card">
              <div className="arch-header">
                <span className="arch-tag">Frontend</span>
                <h4>React 19 & SPA Architecture</h4>
              </div>
              <p>
                Built using Vite & React 19 for fast rendering, dynamic state management with Context API, and client-side routing.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-header">
                <span className="arch-tag">Backend</span>
                <h4>Express.js RESTful APIs</h4>
              </div>
              <p>
                Modular API routes (`/city-api/citizen`, `/city-api/admin`) supporting CORS, request sanitization, and structured responses.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-header">
                <span className="arch-tag">Database</span>
                <h4>MongoDB & Mongoose Schema</h4>
              </div>
              <p>
                NoSQL document model embedding complaint sub-documents within citizen documents for optimized read query latency.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-header">
                <span className="arch-tag">Security</span>
                <h4>JWT & Password Hashing</h4>
              </div>
              <p>
                Stateless session control using JSON Web Tokens (JWT), salted bcrypt password hashing, and cookie parsing.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
