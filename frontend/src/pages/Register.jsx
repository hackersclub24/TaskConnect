import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    skills: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await registerUser(form);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl shadow-black/50">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-50">
          Join the Skillstreet campus
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Team up with other students to handle projects, assignments, and side
          gigs before the deadline hits.
        </p>
        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Your WhatsApp or mobile number"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, Tailwind, Python, UI design"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

