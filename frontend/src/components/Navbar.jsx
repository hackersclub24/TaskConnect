import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-sky-500 text-xs font-bold text-white shadow-md shadow-primary-900/50">
            SS
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold bg-gradient-to-r from-primary-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Skillstreet
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Built for busy college deadlines
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {token ? (
            <>
              <Link
                to="/"
                className="rounded px-3 py-1 hover:bg-slate-800 hover:text-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/create-task"
                className="rounded bg-primary-600 px-3 py-1 font-medium text-white hover:bg-primary-500"
              >
                Create Task
              </Link>
              <button
                onClick={handleLogout}
                className="rounded px-3 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded px-3 py-1 hover:bg-slate-800 hover:text-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded bg-primary-600 px-3 py-1 font-medium text-white hover:bg-primary-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

