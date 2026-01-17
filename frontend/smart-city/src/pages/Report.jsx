// src/pages/Report.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Report.css";
import Swal from "sweetalert2";

const api = axios.create({ baseURL: "http://localhost:5004/city-api" });

const looksLikeObjectId = (s) =>
  typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s);

export default function Report() {
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Road / Pothole");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const getCurrentLocation = async (reverseGeocode = true) => {
    if (!navigator.geolocation)
      return console.log("Geolocation not supported by your browser.");
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          if (!reverseGeocode)
            return setLocation(
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            );
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          setLocation(
            data.display_name ||
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          );
        } catch {
          setLocation(
            `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(
              6
            )}`
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.log("Unable to get location: " + err.message);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (message?.text) {
      Swal.fire({
        icon: message.type === "error" ? "error" : "success",
        title: message.type === "error" ? "Error" : "Success",
        text:
          message.type !== "error"
            ? "Complaint Added Success ✅✅"
            : "Complaint Unsuccessful 🔴🔴",
        confirmButtonText: "OK",
      });
      setMessage(null);
    }
  }, [message]);

  useEffect(() => {
    let mounted = true;
    const parseMaybeJSON = (v) => {
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    };
    const localKeys = [
      "user",
      "currentUser",
      "citizen",
      "authUser",
      "profile",
      "token",
      "accessToken",
      "authToken",
      "userId",
      "citizenId",
    ];
    async function resolveUser() {
      setLoadingUser(true);
      setMessage(null);
      const store = Object.fromEntries(
        localKeys.map((k) => [k, parseMaybeJSON(localStorage.getItem(k))])
      );
      const token = store.token || store.accessToken || store.authToken;
      if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
      else delete api.defaults.headers.common.Authorization;
      const candidates = [
        "user",
        "currentUser",
        "citizen",
        "authUser",
        "profile",
      ];
      for (const k of candidates) {
        const val = store[k];
        if (!val) continue;
        const possible = typeof val === "object" ? val.user || val : val;
        if (possible && (possible._id || possible.id || possible.email)) {
          if (!mounted) return;
          setUser(possible);
          setLoadingUser(false);
          return;
        }
        if (typeof val === "string" && looksLikeObjectId(val)) {
          try {
            const res = await api.get(`/citizen/${val}`);
            if (!mounted) return;
            if (res?.data) {
              setUser(res.data.user || res.data);
              setLoadingUser(false);
              return;
            }
          } catch {}
        }
      }
      for (const pid of [store.userId, store.citizenId].filter(Boolean)) {
        if (typeof pid === "string" && looksLikeObjectId(pid)) {
          try {
            const res = await api.get(`/citizen/${pid}`);
            if (!mounted) return;
            if (res?.data) {
              setUser(res.data.user || res.data);
              setLoadingUser(false);
              return;
            }
          } catch {}
        }
      }
      if (token) {
        try {
          let res = null;
          try {
            res = await api.get("/auth/me");
          } catch {
            res = await api.get("/citizen/me");
          }
          if (res?.data && mounted) {
            setUser(res.data.user || res.data);
            setLoadingUser(false);
            return;
          }
        } catch {}
      }
      if (mounted) {
        setUser(null);
        setLoadingUser(false);
      }
    }
    resolveUser();
    return () => {
      mounted = false;
    };
  }, []);

  const submitIssue = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (loadingUser)
      return setMessage({
        type: "error",
        text: "Checking login status — please wait.",
      });
    if (!user || (!user._id && !user.id))
      return setMessage({
        type: "error",
        text: "User not logged in. Please login first.",
      });
    const complaintData = {
      location: location.trim(),
      category,
      description: description.trim(),
      url: url.trim(),
    };
    if (!complaintData.location || !complaintData.description)
      return setMessage({
        type: "error",
        text: "Please provide location and description.",
      });
    const userId = user._id || user.id;
    try {
      setSubmitting(true);
      const res = await api.post(
        `/citizen/${userId}/complaints`,
        complaintData
      );
      setMessage({
        type: "success",
        text: "Complaint Added Success ✅",
      });
      setLocation("");
      setCategory("Road / Pothole");
      setDescription("");
      setUrl("");
    } catch (err) {
      console.error("Submit error:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to submit complaint. Check server logs / CORS / network.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-card">
        <h2>Report a Civic Issue</h2>
        {loadingUser && <p className="helper">Checking login status...</p>}
        {!loadingUser && !user && (
          <p style={{ color: "red" }}>
            You are not logged in. Please login to submit a complaint.
          </p>
        )}
        <form className="report-form" onSubmit={submitIssue}>
          <label>Location</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Enter area / street"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={!user || submitting}
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => getCurrentLocation(true)}
              disabled={!user || submitting || detectingLocation}
              style={{ padding: "0.5rem 0.8rem" }}
            >
              {detectingLocation ? "Detecting..." : "Use current location"}
            </button>
          </div>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!user}
          >
            <option>Road / Pothole</option>
            <option>Street Light</option>
            <option>Drainage</option>
            <option>Garbage</option>
            <option>Water Leakage</option>
          </select>
          <label>Description</label>
          <textarea
            placeholder="Describe the issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={!user}
            rows={5}
          />
          <label>Image URL (Optional)</label>
          <input
            type="text"
            placeholder="Paste image link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={!user}
          />
          <div className="report-actions">
            <button type="submit" disabled={!user || submitting}>
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
