// Track.jsx
import React, { useEffect, useState } from "react";
import "./Track.css";

const API_BASE = "http://localhost:5004/city-api/citizen";

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
        // IMPORTANT: send cookies so server can read req.cookies.token
        const res = await fetch(`${API_BASE}/track`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // <-- sends cookies to server
        });

        // helpful debug info (open browser console to view)
        // console.log("track response status:", res.status);

        // handle common auth related statuses
        if (res.status === 401) {
          // missing token
          setError("Unauthorized — no token provided. Please login.");
          setLoading(false);
          return;
        }
        if (res.status === 403) {
          // invalid/expired token
          setError(
            "Forbidden — invalid or expired session. Please login again."
          );
          setLoading(false);
          return;
        }
        if (res.status === 202) {
          // your server returns 202 with message "Empty List !"
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

        // The server returns { message: "...", items: [...] }
        const citizens = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        // flatten complaints across all citizens
        const flat = citizens.flatMap((citizen) => {
          const createdAtCitizen = citizen.createdAt || null;
          const username = citizen.username || null;
          return (citizen.complaints || []).map((c) => ({
            ...c,
            _parentId: citizen._id || citizen.id || null,
            _parentUsername: username,
            reportedAt: c.createdAt || createdAtCitizen || null,
          }));
        });

        // optional: sort newest first
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

  if (loading) {
    return (
      <div className="track-wrap">
        <div className="track-header">Complaints</div>
        <div className="track-message">Loading complaints…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-wrap">
        <div className="track-header">Complaints</div>
        <div className="track-error">{error}</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="track-wrap">
        <div className="track-header">Complaints</div>
        <div className="track-message">{message}</div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="track-wrap">
        <div className="track-header">Complaints</div>
        <div className="track-message">No complaints found.</div>
      </div>
    );
  }

  return (
    <div className="track-wrap">
      <div className="track-header">Complaints</div>

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
                  <strong>Reported:</strong> <span>{reported}</span>
                </div>
                {c._parentUsername && (
                  <div className="meta-item">
                    <strong>User:</strong> <span>{c._parentUsername}</span>
                  </div>
                )}
                {c._parentId && (
                  <div className="meta-item">
                    <strong>Parent ID:</strong>{" "}
                    <span className="mono">{String(c._parentId)}</span>
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
