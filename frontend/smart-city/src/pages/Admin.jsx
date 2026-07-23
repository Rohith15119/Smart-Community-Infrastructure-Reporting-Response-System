// Admin.jsx
import React, { useEffect, useState } from "react";
import "./Track.css";
import Swal from "sweetalert2";
import { API_BASE } from "../config";

const API_BASE1 = `${API_BASE}/city-api/citizen`;
const API_BASE2 = `${API_BASE}/city-api/admin`;

export default function Admin() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Read user from localStorage
  const rawUser = localStorage.getItem("user");
  let currentUser = null;
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      currentUser = parsed.user || parsed;
    } catch (e) {
      currentUser = null;
    }
  }
  const currentRole = (currentUser?.role || "").toLowerCase();
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
            status: (c.status || "pending").toLowerCase(),
            feedback: c.feedback || "",
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

  // Update complaint status + feedback
  async function updateComplaintStatus(parentId, complaintId, newStatus, feedback = "") {
    const prev = complaints;

    // Optimistic UI update
    setComplaints((arr) =>
      arr.map((c) =>
        c._id === complaintId
          ? { ...c, status: newStatus, feedback: newStatus === "rejected" ? feedback : c.feedback }
          : c
      )
    );

    try {
      const res = await fetch(
        `${API_BASE2}/complaint/${parentId}/${complaintId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, feedback }),
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
      setComplaints(prev); // Rollback on error
    }
  }

  // Admin action: Mark as Completed / Resolved
  function handleMarkCompleted(parentId, complaintId) {
    updateComplaintStatus(parentId, complaintId, "resolved", "");
  }

  // Admin action: Reject complaint with required reason
  async function handleReject(parentId, complaintId) {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Reason for Rejection",
      input: "textarea",
      inputPlaceholder: "Please enter the reason for rejecting this complaint...",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "You must provide a rejection reason!";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Submit Rejection",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Cancel",
    });

    if (isConfirmed && reason) {
      updateComplaintStatus(parentId, complaintId, "rejected", reason.trim());
    }
  }

  // Render status badge helper
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

  if (!isAdmin) {
    return (
      <div className="track-wrap">
        <div className="track-header">Admin Control Panel</div>
        <div className="track-error">
          You are not authorized to access the admin panel. Please log in as an administrator.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="track-wrap">
        <div className="track-header">Admin Control Panel</div>
        <div className="track-message">Loading complaints…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-wrap">
        <div className="track-header">Admin Control Panel</div>
        <div className="track-error">{error}</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="track-wrap">
        <div className="track-header">Admin Control Panel</div>
        <div className="track-message">{message}</div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="track-wrap">
        <div className="track-header">Admin Control Panel</div>
        <div className="track-message">No complaints found.</div>
      </div>
    );
  }

  return (
    <div className="track-wrap">
      <div className="track-header">Admin Control Panel</div>

      <div className="track-grid">
        {complaints.map((c) => {
          const reported = c.reportedAt
            ? new Date(c.reportedAt).toLocaleString()
            : "Unknown";

          const status = c.status || "pending";
          const isCompleted = status === "resolved" || status === "completed";
          const isRejected = status === "rejected";

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
                  <strong>Status:</strong> {renderStatusPill(status)}
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

              {/* Show Rejection Reason if available */}
              {isRejected && c.feedback && (
                <div className="feedback-box">
                  <strong>Rejection Reason:</strong> {c.feedback}
                </div>
              )}

              {/* Admin Action Buttons */}
              <div className="complaint-actions" style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  className="btn btn-success"
                  onClick={() => handleMarkCompleted(c._parentId, c._id)}
                  disabled={isCompleted}

                >
                  {isCompleted ? "Completed ✅" : "Mark as Completed"}
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(c._parentId, c._id)}
                  disabled={isRejected}
                >
                  {isRejected ? "Rejected ❌" : "Mark as Rejected"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
