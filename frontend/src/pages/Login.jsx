import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await loginUser(form);
      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-black/60 ring-1 ring-slate-900/80 md:grid-cols-[1.1fr,0.9fr] md:p-10">
        <div className="hidden flex-col justify-center md:flex">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300 ring-1 ring-slate-700/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Trusted Skillstreet workspace
          </p>
          <h1 className="mb-3 text-3xl font-semibold text-slate-50">
            Stay on top of{" "}
            <span className="bg-gradient-to-r from-primary-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              college deadlines
            </span>
          </h1>
          <p className="mb-6 text-sm text-slate-400">
            Skillstreet helps students swap skills and finish projects on time,
            even when classes, clubs, and part-time work pile up.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="rounded-2xl bg-slate-900/80 px-4 py-3 ring-1 ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Tasks posted
              </p>
              <p className="text-lg font-semibold text-slate-50">2,300+</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 px-4 py-3 ring-1 ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Average reward
              </p>
              <p className="text-lg font-semibold text-emerald-300">₹1,500</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 px-4 py-3 ring-1 ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Completion rate
              </p>
              <p className="text-lg font-semibold text-sky-300">92%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl shadow-black/50">
            <h2 className="mb-2 text-center text-xl font-semibold text-slate-50">
              Log in to Skillstreet
            </h2>
            <p className="mb-6 text-center text-xs text-slate-400">
              Access your dashboard, tasks, and earnings.
            </p>
            {error && (
              <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
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
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-primary-400">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

