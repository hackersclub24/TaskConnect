import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTasks } from "../services/api";
import TaskCard from "../components/TaskCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            Open tasks
          </h1>
          <p className="text-sm text-slate-400">
            Browse tasks that need your skills.
          </p>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading tasks...</p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-400">
          No tasks yet. Be the first to{" "}
          <button
            onClick={() => navigate("/create-task")}
            className="text-primary-400 underline-offset-2 hover:underline"
          >
            create one
          </button>
          .
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

