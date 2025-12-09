// Admin.jsx
import React, { useEffect, useState } from "react";
import "./Track.css";

const API_BASE1 = "http://localhost:5004/city-api/citizen";
const API_BASE2 = "http://localhost:5004/city-api/admin";

export default function Admin() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // read user from localStorage once
  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser).user : null;
  const currentRole = currentUser?.role || null;
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const res = await fetch(`${API_BASE1}/track`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (res.status === 401) {
          setError("Unauthorized — please login.");
          setLoading(false);
          return;
        }
        if (res.status === 403) {
          setError("Forbidden — invalid session.");
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

        // normalize: data may be { items: [...] } or an array
        const citizens = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        const flat = citizens.flatMap((citizen) => {
          const createdAtCitizen = citizen.createdAt || null;
          const username = citizen.username || null;

          return (citizen.complaints || []).map((c) => ({
            ...c,
            _parentId: citizen._id || citizen.id || null,
            _parentUsername: username,
            reportedAt: c.createdAt || createdAtCitizen || null,
            status: c.status || "pending",
            feedback: c.feedback || "", // new field
          }));
        });

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

  // generic helper for admin to update complaint status + optional feedback
  async function updateComplaintStatus(parentId, complaintId, newStatus) {
    const prev = complaints;

    setComplaints((arr) =>
      arr.map((c) => (c._id === complaintId ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await fetch(
        `${API_BASE2}/complaint/${parentId}/${complaintId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.status === 401 || res.status === 403) {
        throw new Error("Not authorized to change status.");
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}: ${text}`);
      }
    } catch (err) {
      console.error("Status change failed:", err);
      setError(err.message || "Failed to update status");
      setComplaints(prev); // rollback
    }
  }

  // admin: mark complaint as completed / resolved
  function handleMarkCompleted(parentId, complaintId) {
    updateComplaintStatus(parentId, complaintId, "resolved");
  }

  // admin: reject complaint with feedback (required)
  function handleReject(parentId, complaintId) {
    updateComplaintStatus(parentId, complaintId, "rejected");
  }

  if (!isAdmin) {
    return (
      <div className="track-wrap">
        <div className="track-header">Complaints</div>
        <div className="track-error">
          You are not authorized to access admin panel.
        </div>
      </div>
    );
  }

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

      <ul className="track-list">
        {complaints.map((c) => {
          const reported = c.reportedAt
            ? new Date(c.reportedAt).toLocaleString()
            : "Unknown";

          const status = c.status || "pending";

          return (
            <li
              className="complaint-item"
              key={c._id || `${c._parentId}-${c.location}-${reported}`}
            >
              <div className="item-body">
                <div className="row">
                  <strong className="loc">{c.location || "—"}</strong>
                  <span className="cat">{c.category || "—"}</span>
                </div>

                <div className="desc">
                  {c.description || "No description provided."}
                </div>

                <div className="meta">
                  <span>
                    <strong>Reported:</strong> {reported}
                  </span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span className={`status-pill status-${status}`}>
                      {status}
                    </span>
                  </span>
                  {c._parentUsername && (
                    <span>
                      <strong>User:</strong> {c._parentUsername}
                    </span>
                  )}
                </div>

                {/* show feedback if rejected */}
                {status === "rejected" && c.feedback && (
                  <div className="feedback">
                    <strong>Admin Feedback:</strong> {c.feedback}
                  </div>
                )}

                <div className="actions">
                  {/* Only one type of operation: mark completed or rejected */}
                  <button
                    className="btn"
                    onClick={() => handleMarkCompleted(c._parentId, c._id)}
                    disabled={status === "resolved"}
                  >
                    Mark as Completed
                  </button>

                  <button
                    className="btn"
                    onClick={() => handleReject(c._parentId, c._id)}
                    disabled={status === "rejected"}
                  >
                    Mark as Rejected
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
