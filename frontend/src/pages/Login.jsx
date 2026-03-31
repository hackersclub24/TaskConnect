import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, persistAuthTokens } from "../services/api";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
      persistAuthTokens(data.access_token, data.refresh_token);
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
      <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-black/5 ring-1 ring-slate-100 dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/60 dark:ring-slate-900/80 md:grid-cols-[1.1fr,0.9fr] md:p-10">
        <div className="hidden flex-col justify-center md:flex">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-700/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Trusted Skillstreet workspace
          </p>
          <h1 className="mb-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
            Stay on top of{" "}
            <span className="bg-gradient-to-r from-primary-600 via-sky-600 to-emerald-600 dark:from-primary-400 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-transparent">
              college deadlines
            </span>
          </h1>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Skillstreet helps students swap skills and finish projects on time,
            even when classes, clubs, and part-time work pile up.
          </p>
          <div className="mb-6 max-w-md rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-200 dark:ring-slate-700/70">
            <p className="italic">
              &quot;You don&apos;t have to do every assignment alone. The
              smartest students know when to ask for help.&quot;
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">— Skillstreet for Students</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tasks posted
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">2,300+</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Average reward
              </p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">₹1,500</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Completion rate
              </p>
              <p className="text-lg font-semibold text-sky-600 dark:text-sky-300">92%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-black/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/50">
            <h2 className="mb-2 text-center text-xl font-semibold text-slate-900 dark:text-slate-50">
              Log in to Skillstreet
            </h2>
            <p className="mb-6 text-center text-xs text-slate-600 dark:text-slate-400">
              Access your dashboard, tasks, and earnings.
            </p>
            {error && (
              <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
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
              <div className="relative">
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
              <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
              or continue with
              <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
            </div>

            <GoogleLoginButton
              idleText="Sign in with Google"
              loadingText="Signing in with Google..."
              onSuccess={() => {
                setError("");
                navigate("/");
              }}
              onError={(message) => {
                setError(message);
              }}
            />

            <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400">
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

