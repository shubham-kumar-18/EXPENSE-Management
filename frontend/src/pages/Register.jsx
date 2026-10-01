import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password
    };
    if (!payload.name) {
      setError("Name is required");
      return;
    }
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
      const { data } = await api.post("/api/auth/register", payload);
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card max-w-md w-full p-8">
        <h1 className="text-2xl font-display font-semibold mb-6">Create your account</h1>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="Name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          Already have an account? <Link to="/login" className="text-ink font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
