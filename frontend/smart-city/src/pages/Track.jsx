// Track.jsx
import React, { useEffect, useState } from "react";
import "./Track.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5004/city-api/citizen";

export default function Track() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // const showAlert = () => {
  //   Swal.fire("Complaint Added Success ✅ ");
  // };

  // read user from localStorage once
  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser).user : null;
  const currentUsername = currentUser?.username || null;
  const currentRole = currentUser?.role || null;
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const obj = JSON.parse(localStorage.getItem("user"));

        const res = await fetch(`${API_BASE}/track/${obj.user.username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.status === 401) {
          setError("Unauthorized — no token provided. Please login.");
          setLoading(false);
          return;
        }
        if (res.status === 403) {
          setError(
            "Forbidden — invalid or expired session. Please login again."
          );
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
            // ensure a status field exists (default to 'pending')
            status: c.status || "pending",
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

  // DELETE complaint
  async function handleDelete(parentId, complaintId) {
    const { value: ok } = await Swal.fire({
      title: "Delete this complaint?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!ok) return;

    // optimistic UI: remove locally first
    const prev = complaints;
    setComplaints((arr) => arr.filter((c) => c._id !== complaintId));

    try {
      const res = await fetch(
        `${API_BASE}/complaint/${parentId}/${complaintId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 401 || res.status === 403) {
        throw new Error("Not authorized to delete this complaint.");
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      // success — backend removed it; nothing else to do (UI already updated)
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to delete complaint");
      // rollback UI
      setComplaints(prev);
    }
  }

  // PATCH status (admin-only)
  async function handleStatusChange(parentId, complaintId, newStatus) {
    // optimistic update
    const prev = complaints;
    setComplaints((arr) =>
      arr.map((c) => (c._id === complaintId ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await fetch(
        `${API_BASE}/complaint/${parentId}/${complaintId}/status`,
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

      // success — server changed status
    } catch (err) {
      console.error("Status change failed:", err);
      setError(err.message || "Failed to update status");
      // rollback
      setComplaints(prev);
    }
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

      <div className="track-grid">
        {complaints.map((c) => {
          const reported = c.reportedAt
            ? new Date(c.reportedAt).toLocaleString()
            : "Unknown";

          // permission rules:
          // allow owner to delete; allow admin to delete or change status
          const isOwner =
            currentUsername && c._parentUsername === currentUsername;
          const canDelete = isOwner || isAdmin;
          const canManage = isAdmin;

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

                <div className="meta-item">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-pill status-${c.status || "pending"}`}
                  >
                    {c.status || "pending"}
                  </span>
                </div>

                {c._parentUsername && (
                  <div className="meta-item">
                    <strong>User:</strong> <span>{c._parentUsername}</span>
                  </div>
                )}
              </div>

              <div className="complaint-actions">
                {canDelete && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(c._parentId, c._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
