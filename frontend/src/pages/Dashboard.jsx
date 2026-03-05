import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTasks } from "../services/api";
import TaskCard from "../components/TaskCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const { data } = await fetchTasks();
        setTasks(data);
      } catch (err) {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, token]);

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">
            Tasks from students like you
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Trade skills to finish assignments, club work, and side projects
            before the deadline.
          </p>
        </div>
        <button
          onClick={() => navigate("/create-task")}
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
        >
          + Post a new task
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-3 py-1 ${
              statusFilter === "all"
                ? "bg-slate-800 text-slate-50"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`rounded-full px-3 py-1 ${
              statusFilter === "open"
                ? "bg-emerald-600/90 text-white"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter("accepted")}
            className={`rounded-full px-3 py-1 ${
              statusFilter === "accepted"
                ? "bg-amber-500/90 text-slate-950"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`rounded-full px-3 py-1 ${
              statusFilter === "completed"
                ? "bg-sky-500/90 text-slate-950"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Completed
          </button>
        </div>
        {!loading && !error && (
          <p className="text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-100">
              {
                tasks.filter((t) =>
                  statusFilter === "all" ? true : t.status === statusFilter
                ).length
              }
            </span>{" "}
            tasks
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading tasks...</p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
          <p className="mb-2 font-medium text-slate-200">
            No tasks posted yet.
          </p>
          <p>
            Be the first to{" "}
            <button
              onClick={() => navigate("/create-task")}
              className="font-medium text-primary-400 underline-offset-2 hover:underline"
            >
              create one
            </button>{" "}
            and get help before your next deadline.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks
            .filter((task) =>
              statusFilter === "all" ? true : task.status === statusFilter
            )
            .map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

