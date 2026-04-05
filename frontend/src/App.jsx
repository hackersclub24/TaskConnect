import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import SeoManager from "./components/SeoManager";
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
  const location = useLocation();
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

  const getSeoConfig = (pathname) => {
    if (pathname === "/contact") {
      return {
        title: "Contact Skillstreet",
        description:
          "Contact the Skillstreet team to share feedback, report issues, and get support for student task collaboration.",
        robots: "index, follow",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Skillstreet Contact",
          description: "Contact and feedback page for Skillstreet"
        }
      };
    }

    if (pathname === "/reviews") {
      return {
        title: "Skillstreet Reviews",
        description:
          "Read real community reviews about Skillstreet and see how students collaborate to complete projects and tasks.",
        robots: "index, follow",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Skillstreet Reviews",
          description: "Community reviews for Skillstreet"
        }
      };
    }

    if (pathname === "/leaderboard") {
      return {
        title: "Skillstreet Leaderboard",
        description:
          "Explore top contributors on Skillstreet and discover high-performing students across tasks and collaboration projects.",
        robots: "index, follow"
      };
    }

    if (pathname === "/login") {
      return {
        title: "Login",
        description: "Log in to Skillstreet to manage your tasks, collaborations, and project rewards.",
        robots: "noindex, follow"
      };
    }

    if (pathname === "/register") {
      return {
        title: "Create Account",
        description:
          "Create your Skillstreet account to post tasks, collaborate with peers, and build your student reputation.",
        robots: "noindex, follow"
      };
    }

    if (
      pathname === "/" ||
      pathname === "/tasks" ||
      pathname === "/create-task" ||
      pathname.startsWith("/tasks/") ||
      pathname.startsWith("/profile/") ||
      pathname === "/admin/tasks"
    ) {
      return {
        title: "Student Task Dashboard",
        description:
          "Manage assignments, task requests, and student collaborations in your Skillstreet dashboard.",
        robots: "noindex, nofollow"
      };
    }

    return {
      title: "Skillstreet",
      description:
        "Skillstreet is a student task and skill exchange platform for faster project completion and trusted collaboration.",
      robots: "index, follow"
    };
  };

  const seoConfig = getSeoConfig(location.pathname);

  return (
    <div className="min-h-screen">
      <SeoManager
        title={seoConfig.title}
        description={seoConfig.description}
        robots={seoConfig.robots}
        path={location.pathname}
        structuredData={seoConfig.structuredData}
      />
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

