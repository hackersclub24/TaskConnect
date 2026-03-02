import { Link } from "react-router-dom";

const statusColors = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  accepted: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  completed: "bg-sky-500/20 text-sky-300 border-sky-500/40"
};

const TaskCard = ({ task }) => {
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : "No deadline";

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40 transition hover:border-primary-600 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-50">{task.title}</h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
            statusColors[task.status] || "bg-slate-700 text-slate-200"
          }`}
        >
          {task.status}
        </span>
      </div>
      <p className="line-clamp-2 text-xs text-slate-300">
        {task.description}
      </p>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>Deadline: {deadline}</span>
        {task.reward && (
          <span className="font-semibold text-emerald-300">
            ₹{Number(task.reward).toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default TaskCard;

