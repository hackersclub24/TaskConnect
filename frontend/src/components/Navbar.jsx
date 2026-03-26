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
  GraduationCap,
  Star,
  User,
  Trophy,
  Coins
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCurrentUser, getTokenBalance } from "../services/api";
import PremiumFeaturesModal from "./PremiumFeaturesModal";

const Navbar = ({ theme = "dark", onToggleTheme }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isDark = theme === "dark";

  const [currentUserId, setCurrentUserId] = useState(() => {
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        return payload.sub || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [tokenBalance, setTokenBalance] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (token && !currentUserId) {
      const getMe = async () => {
        try {
          const { data } = await fetchCurrentUser();
          setCurrentUserId(data.id);
        } catch {
          // fail silently
        }
      };
      getMe();
    }
  }, [token, currentUserId]);

  useEffect(() => {
    if (token) {
      const fetchTokens = async () => {
        try {
          const { data } = await getTokenBalance();
          setTokenBalance(data.balance);
          setIsPremium(data.is_premium || false);
        } catch {
          // fail silently
        }
      };
      fetchTokens();
    }
  }, [token]);

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/80 transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-primary-900/40">
            <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="bg-gradient-to-r from-primary-600 via-sky-500 to-emerald-500 dark:from-primary-400 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-lg font-bold text-transparent font-heading">
              Skillstreet
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Built for busy college deadlines
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3"
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

          {token && tokenBalance !== null && (
            <button
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <Coins className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline">{tokenBalance}</span>
            </button>
          )}

          {token ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
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
                to={currentUserId ? `/profile/${currentUserId}` : "#"}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  !currentUserId
                    ? "pointer-events-none opacity-50 text-slate-600 dark:text-slate-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                }`}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Profile</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              <Link
                to="/reviews"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              <Link
                to="/reviews"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
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

      <PremiumFeaturesModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        tokenBalance={tokenBalance}
        isPremium={isPremium}
      />
    </>
  );
};

export default Navbar;
