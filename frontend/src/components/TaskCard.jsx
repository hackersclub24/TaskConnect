import { Link } from "react-router-dom";
import { Calendar, IndianRupee, Building2, BookOpen, Users, AlertCircle, Crown } from "lucide-react";

// Status badge colors
const statusColors = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40",
  accepted: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40",
  completed: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40"
};

// Category config for icons and colors
const categoryConfig = {
  paid: { label: "Paid", icon: IndianRupee, color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30" },
  learning: { label: "Learning", icon: BookOpen, color: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/30" },
  collaboration: { label: "Collaboration", icon: Users, color: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/30" }
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
  const taskRef = task.slug || task.id;
  const isAccepted = task.status === "accepted";

  return (
    <Link
      to={`/tasks/${taskRef}`}
      className={`group relative flex min-h-0 flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-900/5 dark:bg-slate-900/70 dark:hover:border-primary-500/40 dark:hover:bg-slate-900/90 dark:hover:shadow-primary-900/10 ${
        isAccepted
          ? "border-amber-300/80 ring-1 ring-amber-400/15 dark:border-amber-500/40"
          : "border-slate-200 dark:border-slate-800/80"
      }`}
    >
      {isAccepted && (
        <span className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-amber-400/70" />
      )}

      {isAccepted && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 shadow-sm shadow-amber-500/10 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          In progress
        </span>
      )}

      {/* Top row: title, status, badges - prevent overlap with flex-wrap */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 line-clamp-2 text-base font-semibold font-heading leading-snug text-slate-900 group-hover:text-primary-600 dark:text-slate-50 dark:group-hover:text-primary-300 sm:text-[15px]">
          {task.title}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            statusColors[task.status] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Category and college badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${category.color}`}
        >
          <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
          {category.label}
        </span>
        {task.inter_college_only && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            Inter-College
          </span>
        )}
        {isFromMyCollege && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            From Your College
          </span>
        )}
        {(task.is_urgent || task.urgency_status) && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm shadow-red-500/10 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            URGENT
          </span>
        )}
        {task.premium_early_access && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700 shadow-sm shadow-yellow-500/10 dark:border-yellow-500/40 dark:bg-yellow-500/15 dark:text-yellow-300">
            <Crown className="h-3.5 w-3.5 shrink-0" />
            PREMIUM ACCESS
          </span>
        )}
      </div>

      <p className="line-clamp-3 min-h-0 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {task.description}
      </p>

      {/* Footer: meta info - consistent spacing */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            {deadline}
          </span>
          {task.reward != null && Number(task.reward) > 0 && (
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              {Number(task.reward).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <span className="max-w-[50%] truncate text-xs font-medium text-slate-500">
          {task.owner?.college_name ? `${task.owner.college_name}` : "Student"} #{task.owner_id}
        </span>
      </div>
    </Link>
  );
};

export default TaskCard;
