import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  MessageCircle,
  GraduationCap
} from "lucide-react";

const Navbar = ({ theme = "dark", onToggleTheme }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isDark = theme === "dark";

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-primary-900/40">
            <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="bg-gradient-to-r from-primary-400 via-sky-400 to-emerald-400 bg-clip-text text-lg font-semibold text-transparent">
              Skillstreet
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Built for busy college deadlines
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-900/60 px-2.5 py-1.5 text-slate-200 transition-colors hover:bg-slate-800 sm:px-3"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="hidden text-xs font-medium sm:inline">
              {isDark ? "Dark" : "Light"}
            </span>
          </button>

          {token ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-slate-50"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                to="/create-task"
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-900/40 transition-all hover:bg-primary-500 hover:shadow-primary-900/50"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Create Task</span>
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/contact"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-50"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-500"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
