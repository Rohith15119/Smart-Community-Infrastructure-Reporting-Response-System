// Register.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Set your backend base URL here
const API_BASE = "http://localhost:5004";
const REGISTER_PATH = "/city-api/citizen/register"; // change if your route differs

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm();

  const navigate = useNavigate();

  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const password = watch("password", "");

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccessMsg(null);

    // prepare payload matching your Mongoose schema
    const payload = {
      username: data.username,
      password: data.password,
      email: data.email,
      phoneNumber: Number(data.phoneNumber), // convert to number if backend expects numeric
      complaints: [],
    };

    try {
      const res = await axios.post(`${API_BASE}${REGISTER_PATH}`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setSuccessMsg("Registration successful — redirecting to login...");
      reset();

      // navigate after short delay to show success message
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      // robust error message handling
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed";
      setServerError(msg);
    }
  };

  return (
    <div className="register-page">
      <div className="card">
        <h2 className="card-title">Create an account</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          {/* Username */}
          <label className="field">
            <span className="label">Username</span>
            <input
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
              })}
              placeholder="johndoe"
              className={errors.username ? "input error" : "input"}
            />
            <small className="errorMsg">{errors.username?.message}</small>
          </label>

          {/* Email */}
          <label className="field">
            <span className="label">Email</span>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
              placeholder="you@example.com"
              className={errors.email ? "input error" : "input"}
            />
            <small className="errorMsg">{errors.email?.message}</small>
          </label>

          {/* Phone Number */}
          <label className="field">
            <span className="label">Phone Number</span>
            <input
              {...register("phoneNumber", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{7,15}$/,
                  message: "Digits only (7–15 characters)",
                },
              })}
              placeholder="9876543210"
              inputMode="numeric"
              className={errors.phoneNumber ? "input error" : "input"}
            />
            <small className="errorMsg">{errors.phoneNumber?.message}</small>
          </label>

          {/* Password */}
          <label className="field">
            <span className="label">Password</span>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
              placeholder="At least 6 characters"
              className={errors.password ? "input error" : "input"}
            />
            <small className="errorMsg">{errors.password?.message}</small>
          </label>

          {/* Confirm Password */}
          <label className="field">
            <span className="label">Confirm Password</span>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Confirm your password",
                validate: (v) => v === password || "Passwords do not match",
              })}
              placeholder="Repeat password"
              className={errors.confirmPassword ? "input error" : "input"}
            />
            <small className="errorMsg">
              {errors.confirmPassword?.message}
            </small>
          </label>

          {/* Server Messages */}
          {serverError && (
            <div className="alert error-alert" role="alert">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="alert success-alert" role="status">
              {successMsg}
            </div>
          )}

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Create Account"}
          </button>

          <div className="footer-line">
            Already a member?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
