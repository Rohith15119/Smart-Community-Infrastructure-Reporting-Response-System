// All_Reports.jsx
import React, { useEffect, useState } from "react";
import "./Track.css";
import { API_BASE } from "../config";

const API_BASE_CITIZEN = `${API_BASE}/city-api/citizen`;

export default function All_Reports() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const res = await fetch(`${API_BASE_CITIZEN}/track`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.status === 401) {
          setError("Unauthorized — please login.");
          setLoading(false);
          return;
        }
        if (res.status === 403) {
          setError("Forbidden — invalid or expired session.");
          setLoading(false);
          return;
        }
        if (res.status === 202) {
          const body = await res.json().catch(() => ({}));
          setMessage(body.message || "No complaints yet.");
          setComplaints([]);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Server error ${res.status}: ${text}`);
        }

        const data = await res.json();

        const citizens = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        // Flatten complaints across all citizens and include status
        const flat = citizens.flatMap((citizen) => {
          const createdAtCitizen = citizen.createdAt || null;
          const username = citizen.username || null;
          return (citizen.complaints || []).map((c) => ({
            ...c,
            _parentId: citizen._id || citizen.id || null,
            _parentUsername: username,
            reportedAt: c.createdAt || createdAtCitizen || null,
            status: (c.status || "pending").toLowerCase(),
          }));
        });

        // Sort newest first
        flat.sort((a, b) => {
          const ta = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
          const tb = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
          return tb - ta;
        });

        setComplaints(flat);
      } catch (err) {
        console.error("Failed to load complaints:", err);
        setError(err.message || "Failed to fetch complaints");
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, []);

  // Helper to format status text nicely
  const renderStatusPill = (status) => {
    let label = "Pending";
    let className = "status-pill status-pending";

    if (status === "resolved" || status === "completed") {
      label = "Solved ✅";
      className = "status-pill status-resolved";
    } else if (status === "rejected") {
      label = "Rejected ❌";
      className = "status-pill status-rejected";
    } else if (status === "in-progress") {
      label = "In Progress ⚙️";
      className = "status-pill status-in-progress";
    }

    return <span className={className}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="track-wrap">
        <div className="track-header">Community Complaints</div>
        <div className="track-message">Loading complaints…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-wrap">
        <div className="track-header">Community Complaints</div>
        <div className="track-error">{error}</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="track-wrap">
        <div className="track-header">Community Complaints</div>
        <div className="track-message">{message}</div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="track-wrap">
        <div className="track-header">Community Complaints</div>
        <div className="track-message">No complaints found.</div>
      </div>
    );
  }

  return (
    <div className="track-wrap">
      <div className="track-header">Community Complaints</div>

      <div className="track-grid">
        {complaints.map((c) => {
          const reported = c.reportedAt
            ? new Date(c.reportedAt).toLocaleString()
            : "Unknown";

          return (
            <article
              className="complaint-card"
              key={c._id || `${c._parentId}-${c.location}-${reported}`}
            >
              <div className="complaint-row">
                <h3 className="complaint-location">{c.location || "—"}</h3>
                <span className="complaint-category">{c.category || "—"}</span>
              </div>

              <p className="complaint-description">
                {c.description || "No description provided."}
              </p>

              <div className="complaint-meta">
                <div className="meta-item">
                  <strong>Status:</strong> {renderStatusPill(c.status)}
                </div>

                <div className="meta-item">
                  <strong>Reported:</strong> <span>{reported}</span>
                </div>

                {c._parentUsername && (
                  <div className="meta-item">
                    <strong>User:</strong> <span>{c._parentUsername}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
