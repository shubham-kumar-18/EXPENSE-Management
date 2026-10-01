import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [resetForm, setResetForm] = useState({ email: "", otp: "", password: "" });
  const [resetStep, setResetStep] = useState("email");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
  };

  const showLogin = () => {
    setMode("login");
    setError("");
    setMessage("");
  };

  const showForgotPassword = () => {
    setMode("forgot");
    setResetForm({ email: form.email, otp: "", password: "" });
    setResetStep("email");
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password
    };
    if (!emailRegex.test(payload.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!payload.password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", payload);
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const email = resetForm.email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setResetForm({ ...resetForm, email });
      setResetStep("otp");
      setMessage(data.message || "OTP sent. Check your email.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reach the API. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      email: resetForm.email.trim().toLowerCase(),
      otp: resetForm.otp.trim(),
      password: resetForm.password
    };
    if (!emailRegex.test(payload.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!payload.otp) {
      setError("OTP is required");
      return;
    }
    if (payload.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/reset-password", payload);
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card max-w-md w-full p-8">
        <h1 className="text-2xl font-display font-semibold mb-6">
          {mode === "login" ? "Welcome back" : "Reset password"}
        </h1>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {message && <p className="text-sm text-emerald-600 mb-4">{message}</p>}
        {mode === "login" ? (
          <>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                className="input"
                placeholder="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                className="input"
                placeholder="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-semibold text-ink hover:text-slate-700"
                  onClick={showForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
            <p className="text-sm text-slate-500 mt-4">
              New here? <Link to="/register" className="text-ink font-semibold">Create an account</Link>
            </p>
          </>
        ) : (
          <>
            <form
              className="space-y-4"
              onSubmit={resetStep === "email" ? handleRequestOtp : handleResetPassword}
            >
              <input
                className="input"
                placeholder="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={resetForm.email}
                onChange={handleResetChange}
                required
                disabled={resetStep === "otp"}
              />
              {resetStep === "otp" && (
                <>
                  <input
                    className="input"
                    placeholder="OTP"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={resetForm.otp}
                    onChange={handleResetChange}
                    required
                  />
                  <input
                    className="input"
                    placeholder="New password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={resetForm.password}
                    onChange={handleResetChange}
                    required
                  />
                </>
              )}
              <button className="btn-primary w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : resetStep === "email"
                    ? "Send OTP"
                    : "Reset and login"}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <button
                type="button"
                className="font-semibold text-ink hover:text-slate-700"
                onClick={showLogin}
              >
                Back to login
              </button>
              {resetStep === "otp" && (
                <button
                  type="button"
                  className="font-semibold text-ink hover:text-slate-700"
                  onClick={handleRequestOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
