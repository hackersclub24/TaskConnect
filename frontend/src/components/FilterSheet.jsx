import { useState } from "react";
import { X, Settings } from "lucide-react";

const CATEGORY_TABS = [
  { value: "", label: "All Categories" },
  { value: "paid", label: "Paid Tasks" },
  { value: "learning", label: "Learning Help" },
  { value: "collaboration", label: "Collaboration" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "urgent", label: "Urgent" },
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" }
];

export const FilterButton = ({ onClick, taskCount }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-500"
    >
      <Settings className="h-4 w-4" />
      <span>Filter</span>
      {taskCount > 0 && (
        <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
          {taskCount > 9 ? "9+" : taskCount}
        </span>
      )}
    </button>
  );
};

const FilterSheet = ({
  isOpen,
  onClose,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sameCollegeOnly,
  setSameCollegeOnly,
  currentUser,
  taskCount
}) => {
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempStatus, setTempStatus] = useState(statusFilter);
  const [tempCollege, setTempCollege] = useState(sameCollegeOnly);

  const handleApply = () => {
    setCategoryFilter(tempCategory);
    setStatusFilter(tempStatus);
    setSameCollegeOnly(tempCollege);
    onClose();
  };

  const handleReset = () => {
    setTempCategory("");
    setTempStatus("open");
    setTempCollege(false);
    setCategoryFilter("");
    setStatusFilter("open");
    setSameCollegeOnly(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex origin-bottom flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800/80 dark:bg-slate-950 transition-all duration-300 ease-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800/80">
          <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-50">
            Filter Tasks
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Category Section */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-200">
              Category
            </label>
            <div className="space-y-2">
              {CATEGORY_TABS.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setTempCategory(category.value)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                    tempCategory === category.value
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Section */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-200">
              Task Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setTempStatus(status.value)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                    tempStatus === status.value
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* College Filter */}
          {currentUser?.college_name && (
            <div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition-all dark:border-slate-700 dark:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={tempCollege}
                  onChange={(e) => setTempCollege(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-primary-600"
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Show only from my college
                </span>
              </label>
            </div>
          )}

          {/* Task Count Info */}
          {taskCount > 0 && (
            <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
              <p className="text-xs text-primary-700 dark:text-primary-300">
                {taskCount} task{taskCount !== 1 ? "s" : ""} match your current filters
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/50 space-y-3">
          <button
            onClick={handleApply}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-primary-600/40 active:translate-y-0 dark:hover:bg-primary-500"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSheet;
