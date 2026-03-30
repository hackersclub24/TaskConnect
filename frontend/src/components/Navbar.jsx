import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  MessageCircle,
  Star,
  User,
  Trophy,
  Coins,
  Menu,
  X,
  ChevronDown,
  ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCurrentUser, getTokenBalance } from "../services/api";
import PremiumFeaturesModal from "./PremiumFeaturesModal";

const Navbar = ({ theme = "dark", onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileMoreOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    closeMobileMenu();
    navigate("/login");
  };

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

  const desktopLinkClass =
    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50";

  const mobileLinkClass =
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

  const isPathActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/profile") return location.pathname.startsWith("/profile/");
    return location.pathname === path;
  };

  const handleTasksTabTap = (e) => {
    if (isPathActive("/tasks")) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeMobileMenu();
    }
  };

  const handleReviewsTabTap = (e) => {
    if (isPathActive("/reviews")) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeMobileMenu();
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-90 sm:flex-none"
            >
              <img
                src="/skillstreet-icon.png"
                alt="Skillstreet logo"
                className="h-10 w-10 object-contain"
              />
              <div className="min-w-0 flex flex-col leading-tight">
                <span className="bg-gradient-to-r from-primary-600 via-sky-500 to-emerald-500 bg-clip-text text-lg font-bold text-transparent font-heading dark:from-primary-400 dark:via-sky-400 dark:to-emerald-400">
                  Skillstreet
                </span>
                <span className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">
                  Built for busy college deadlines
                </span>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3"
                aria-label="Toggle theme"
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="hidden text-xs font-medium sm:inline">{isDark ? "Dark" : "Light"}</span>
              </button>

              {token && tokenBalance !== null && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 sm:flex sm:px-3"
                >
                  <Coins className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold sm:inline">{tokenBalance}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mt-3 hidden items-center gap-1 md:flex lg:gap-2">
            {token ? (
              <>
                <Link to="/" className={`${desktopLinkClass} font-medium`}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/create-task"
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-900/40 transition-all hover:bg-primary-500 hover:shadow-primary-900/50"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Task</span>
                </Link>
                <Link
                  to={currentUserId ? `/profile/${currentUserId}` : "#"}
                  className={
                    !currentUserId
                      ? "pointer-events-none flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm opacity-50 text-slate-600 dark:text-slate-300"
                      : desktopLinkClass
                  }
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <Link to="/leaderboard" className={desktopLinkClass}>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Leaderboard</span>
                </Link>
                <Link to="/reviews" className={desktopLinkClass}>
                  <Star className="h-4 w-4" />
                  <span>Reviews</span>
                </Link>
                <Link to="/contact" className={desktopLinkClass}>
                  <MessageCircle className="h-4 w-4" />
                  <span>Contact</span>
                </Link>
                <button onClick={handleLogout} className={desktopLinkClass}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/leaderboard" className={desktopLinkClass}>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Leaderboard</span>
                </Link>
                <Link to="/reviews" className={desktopLinkClass}>
                  <Star className="h-4 w-4" />
                  <span>Reviews</span>
                </Link>
                <Link to="/contact" className={desktopLinkClass}>
                  <MessageCircle className="h-4 w-4" />
                  <span>Contact</span>
                </Link>
                <Link to="/login" className={desktopLinkClass}>
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-500"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 md:hidden">
              {token ? (
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Main
                    </p>
                    <div className="space-y-1.5">
                      <Link
                        to="/create-task"
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-500 active:scale-[0.98]"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Create Task
                      </Link>
                      <Link to="/" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        to={currentUserId ? `/profile/${currentUserId}` : "#"}
                        onClick={closeMobileMenu}
                        className={
                          !currentUserId
                            ? "pointer-events-none flex items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-50 text-slate-500 dark:text-slate-400"
                            : `${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`
                        }
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Explore
                    </p>
                    <button
                      type="button"
                      onClick={() => setMobileMoreOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:bg-slate-100 active:scale-[0.98] dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        More
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileMoreOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div
                      className={`grid overflow-hidden transition-all duration-300 ${mobileMoreOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="min-h-0 space-y-1.5">
                        <Link to="/leaderboard" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Leaderboard
                        </Link>
                        <Link to="/reviews" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                          <Star className="h-4 w-4" />
                          Reviews
                        </Link>
                        <Link to="/contact" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                          <MessageCircle className="h-4 w-4" />
                          Contact
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Account
                    </p>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-[0.98] dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Main
                    </p>
                    <div className="space-y-1.5">
                      <Link to="/login" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-500 active:scale-[0.98]"
                      >
                        <UserPlus className="h-4 w-4" />
                        Register
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Explore
                    </p>
                    <div className="space-y-1.5">
                      <Link to="/leaderboard" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Leaderboard
                      </Link>
                      <Link to="/reviews" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                        <Star className="h-4 w-4" />
                        Reviews
                      </Link>
                      <Link to="/contact" onClick={closeMobileMenu} className={`${mobileLinkClass} transition-all duration-200 active:scale-[0.98]`}>
                        <MessageCircle className="h-4 w-4" />
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {token && (
        <div className="fixed bottom-2 left-1/2 z-30 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 md:hidden">
          <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85">
            <div className="flex items-end justify-between">
              <Link
                to="/tasks"
                onClick={handleTasksTabTap}
                className={`flex min-w-[56px] flex-col items-center gap-1 py-1 text-[10px] transition-all duration-200 active:scale-95 ${
                  isPathActive("/tasks")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <ClipboardList className={`h-5 w-5 ${isPathActive("/tasks") ? "stroke-[2.4]" : ""}`} />
                <span className="font-medium">Tasks</span>
              </Link>

              <Link
                to="/leaderboard"
                onClick={closeMobileMenu}
                className={`flex min-w-[56px] flex-col items-center gap-1 py-1 text-[10px] transition-all duration-200 active:scale-95 ${
                  isPathActive("/leaderboard")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Trophy className={`h-5 w-5 ${isPathActive("/leaderboard") ? "stroke-[2.4]" : ""}`} />
                <span className="font-medium">Leaderboard</span>
              </Link>

              <Link
                to="/create-task"
                onClick={closeMobileMenu}
                className="-mt-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-fuchsia-500 text-white shadow-[0_10px_25px_rgba(99,102,241,0.45)] ring-4 ring-white/60 transition-all duration-200 hover:brightness-110 active:scale-95 dark:ring-slate-900/80"
                aria-label="Create Task"
              >
                <PlusCircle className="h-6 w-6" />
              </Link>

              <Link
                to="/reviews"
                onClick={handleReviewsTabTap}
                className={`flex min-w-[56px] flex-col items-center gap-1 py-1 text-[10px] transition-all duration-200 active:scale-95 ${
                  isPathActive("/reviews")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Star className={`h-5 w-5 ${isPathActive("/reviews") ? "stroke-[2.4]" : ""}`} />
                <span className="font-medium">Reviews</span>
              </Link>

              <Link
                to={currentUserId ? `/profile/${currentUserId}` : "#"}
                onClick={closeMobileMenu}
                className={`flex min-w-[56px] flex-col items-center gap-1 py-1 text-[10px] transition-all duration-200 active:scale-95 ${
                  isPathActive("/profile")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                } ${!currentUserId ? "pointer-events-none opacity-50" : ""}`}
              >
                <User className={`h-5 w-5 ${isPathActive("/profile") ? "stroke-[2.4]" : ""}`} />
                <span className="font-medium">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}

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
