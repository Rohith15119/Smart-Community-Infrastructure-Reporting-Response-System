// src/config.js
// Set VITE_API_BASE_URL in Vercel environment variables to point to your Render backend domain
// Example: https://smart-community-backend.onrender.com
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5004";
