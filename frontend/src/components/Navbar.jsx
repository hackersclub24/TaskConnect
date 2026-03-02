import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary-400">
            TaskConnect
          </span>
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

