import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptTask, fetchTaskById } from "../services/api";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const { data } = await fetchTaskById(id);
        setTask(data);
      } catch {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      const { data } = await acceptTask(id);
      setTask(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not accept this task right now."
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-400">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-red-300">
        Task not found.
      </div>
    );
  }

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : "No deadline";

  const canAccept = task.status === "open";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-xs text-slate-400 hover:text-slate-200"
      >
        ← Back
      </button>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-50">
            {task.title}
          </h1>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-0.5 text-xs uppercase tracking-wide text-slate-200">
            {task.status}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-300">{task.description}</p>
        <div className="mb-4 grid gap-3 text-xs text-slate-400 md:grid-cols-3">
          <div>
            <p className="text-slate-500">Deadline</p>
            <p>{deadline}</p>
          </div>
          <div>
            <p className="text-slate-500">Reward</p>
            <p>
              {task.reward
                ? `₹${Number(task.reward).toFixed(2)}`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Assigned to</p>
            <p>{task.assigned_to ? `User #${task.assigned_to}` : "Unassigned"}</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <div className="mt-2 flex gap-3">
          <button
            onClick={handleAccept}
            disabled={!canAccept || accepting}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
          >
            {canAccept
              ? accepting
                ? "Accepting..."
                : "Accept task"
              : "Not available"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;

