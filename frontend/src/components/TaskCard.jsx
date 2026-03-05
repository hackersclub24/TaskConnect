import { Link } from "react-router-dom";

const statusColors = {
  open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  accepted: "bg-amber-500/10 text-amber-300 border-amber-500/40",
  completed: "bg-sky-500/10 text-sky-300 border-sky-500/40"
};

const TaskCard = ({ task }) => {
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : "No deadline";
  const acceptedCount = task.status === "accepted" ? 1 : 0;

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-sm shadow-black/40 transition hover:-translate-y-0.5 hover:border-primary-600 hover:bg-slate-900 hover:shadow-md hover:shadow-black/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-50 group-hover:text-slate-50">
          {task.title}
        </h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
            statusColors[task.status] || "bg-slate-700 text-slate-200"
          }`}
        >
          {task.status}
        </span>
      </div>
      <p className="line-clamp-3 text-xs text-slate-300">
        {task.description}
      </p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="truncate">Deadline: {deadline}</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Posted by Student #{task.owner_id}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
            {acceptedCount}{" "}
            {acceptedCount === 1 ? "freelancer" : "freelancers"}
          </span>
          {task.reward && (
            <span className="text-xs font-semibold text-emerald-300">
              ₹{Number(task.reward).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;

