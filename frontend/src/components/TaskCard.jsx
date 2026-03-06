import { Link } from "react-router-dom";
import { Calendar, IndianRupee, Building2, BookOpen, Users } from "lucide-react";

// Status badge colors
const statusColors = {
  open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  accepted: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  completed: "bg-sky-500/15 text-sky-300 border-sky-500/40"
};

// Category config for icons and colors
const categoryConfig = {
  paid: { label: "Paid", icon: IndianRupee, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  learning: { label: "Learning", icon: BookOpen, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  collaboration: { label: "Collaboration", icon: Users, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" }
};

const TaskCard = ({ task, currentUserCollege, showCollegeBadge }) => {
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "No deadline";
  const isFromMyCollege =
    showCollegeBadge &&
    currentUserCollege &&
    task.owner?.college_name &&
    task.owner.college_name === currentUserCollege;
  const category = categoryConfig[task.category || "paid"] || categoryConfig.paid;
  const CategoryIcon = category.icon;

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group flex min-h-0 flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-primary-900/10"
    >
      {/* Top row: title, status, badges - prevent overlap with flex-wrap */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-snug text-slate-50 group-hover:text-primary-300 sm:text-[15px]">
          {task.title}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            statusColors[task.status] || "bg-slate-700 text-slate-200"
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Category and college badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${category.color}`}
        >
          <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
          {category.label}
        </span>
        {task.inter_college_only && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            Inter-College
          </span>
        )}
        {isFromMyCollege && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary-500/40 bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            From Your College
          </span>
        )}
      </div>

      <p className="line-clamp-3 min-h-0 flex-1 text-sm leading-relaxed text-slate-300">
        {task.description}
      </p>

      {/* Footer: meta info - consistent spacing */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            {deadline}
          </span>
          {task.reward != null && Number(task.reward) > 0 && (
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              {Number(task.reward).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <span className="max-w-[50%] truncate text-xs text-slate-500">
          {task.owner?.college_name ? `${task.owner.college_name}` : "Student"} #{task.owner_id}
        </span>
      </div>
    </Link>
  );
};

export default TaskCard;
