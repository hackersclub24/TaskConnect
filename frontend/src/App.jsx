import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import TaskDetails from "./pages/TaskDetails";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import PlatformReviews from "./pages/PlatformReviews";
import Leaderboard from "./pages/Leaderboard";
import AdminTasks from "./pages/AdminTasks";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.6),transparent_55%),radial-gradient(circle_at_bottom,_rgba(224,231,255,0.7),transparent_55%)] transition-colors duration-500 dark:bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(8,47,73,0.7),transparent_55%)]" />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reviews" element={<PlatformReviews />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile/:userRef" element={<Profile />} />
          <Route
            path="/create-task"
            element={
              <PrivateRoute>
                <CreateTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:taskRef"
            element={
              <PrivateRoute>
                <TaskDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <PrivateRoute>
                <AdminTasks />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

