import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Award, Lock, Building2 } from "lucide-react";
import { registerUser } from "../services/api";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    skills: "",
    college_name: ""
  });
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl shadow-black/50 sm:p-8">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-50">
          Join the Skillstreet campus
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Team up with other students to handle projects, assignments, and side
          gigs before the deadline hits.
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Mail className="h-3.5 w-3.5" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Building2 className="h-3.5 w-3.5" />
              College (optional)
            </label>
            <input
              type="text"
              name="college_name"
              value={form.college_name}
              onChange={handleChange}
              placeholder="e.g. IIT Delhi, BITS Pilani"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Phone className="h-3.5 w-3.5" />
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
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Award className="h-3.5 w-3.5" />
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
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Lock className="h-3.5 w-3.5" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-300 hover:text-slate-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
          <span className="h-px flex-1 bg-slate-700" />
          or sign up with
          <span className="h-px flex-1 bg-slate-700" />
        </div>

        <GoogleLoginButton
          idleText="Continue with Google"
          loadingText="Connecting Google..."
          onSuccess={({ backendResponse }) => {
            setError("");
            setSuccess(
              "Google account connected. You can add skills and bio from Profile."
            );

            const userId = backendResponse?.user?.id;
            if (userId) {
              navigate(`/profile/${userId}`);
              return;
            }

            navigate("/");
          }}
          onError={(message) => {
            setSuccess("");
            setError(message);
          }}
        />

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
