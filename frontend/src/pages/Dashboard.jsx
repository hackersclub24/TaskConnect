import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Filter, GraduationCap, Sparkles } from "lucide-react";
import { fetchCurrentUser, fetchRecommendedTasks, fetchTasks, fetchUrgentTasks } from "../services/api";
import TaskCard from "../components/TaskCard";
import FilterSheet, { FilterButton } from "../components/FilterSheet";

const CATEGORY_TABS = [
  { value: "", label: "All" },
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sameCollegeOnly, setSameCollegeOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const params = {};
        if (categoryFilter) params.category = categoryFilter;
        if (sameCollegeOnly) params.same_college_only = true;

        const [{ data: tasksData }, { data: meData }, { data: urgentTasksData }] = await Promise.all([
          fetchTasks(params),
          fetchCurrentUser(),
          fetchUrgentTasks()
        ]);
        setTasks(tasksData);
        setUrgentTasks(urgentTasksData);
        setCurrentUser(meData);
        try {
          const { data: recData } = await fetchRecommendedTasks(meData.id);
          setRecommended(recData || []);
        } catch {
          setRecommended([]);
        } finally {
          setRecLoading(false);
        }
      } catch (err) {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, token, categoryFilter, sameCollegeOnly]);

  const filteredTasks = statusFilter === "urgent"
    ? urgentTasks
    : tasks.filter((t) =>
        statusFilter === "all" ? true : t.status === statusFilter
      );

  return (
    <div className="py-6 sm:py-8">
      {/* Hero section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 sm:text-4xl">
            Tasks from students like you
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Trade skills to finish assignments, club work, and side projects
            before the deadline.
          </p>
        </div>
        <button
          onClick={() => navigate("/create-task")}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 hover:-translate-y-0.5 hover:shadow-primary-900/40 dark:shadow-primary-900/40 transition-all hover:bg-primary-500 dark:hover:shadow-primary-900/50"
        >
          <PlusCircle className="h-5 w-5" />
          Post a new task
        </button>
      </div>

      {/* Filters - Responsive: mobile button vs desktop inline */}
      <div className="mb-6 space-y-3 border-y border-slate-200/70 py-3 dark:border-slate-800/80">
        {/* Mobile Filter Button (hidden on md+) */}
        <div className="md:hidden flex items-center gap-3">
          <Filter className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <FilterButton 
            onClick={() => setFilterSheetOpen(true)} 
            taskCount={filteredTasks.length}
          />
        </div>

        {/* Desktop Inline Filters (hidden on sm) */}
        <div className="hidden md:block space-y-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("");
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === "all" && !categoryFilter
                    ? "bg-slate-800 text-white dark:bg-slate-700 dark:text-slate-50"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("urgent")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === "urgent"
                    ? "bg-red-100 text-red-800 ring-1 ring-red-500/50 dark:bg-red-500/90 dark:text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Urgent
              </button>
              <button
                onClick={() => setCategoryFilter("paid")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === "paid"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter("open")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === "open"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/90 dark:text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Open
              </button>
            </div>
            <label className="ml-0 flex items-center gap-2 text-xs font-medium text-slate-500 sm:ml-auto dark:text-slate-400">
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-40 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm font-medium leading-none text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none sm:w-44 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {CATEGORY_TABS.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser?.college_name && (
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={sameCollegeOnly}
                  onChange={(e) => setSameCollegeOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded"
                />
                <GraduationCap className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">From my college only</span>
              </label>
            )}
          </div>
          {!loading && !error && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTasks.length}</span> tasks
            </p>
          )}
        </div>

        {/* Mobile - Show task count info */}
        <div className="md:hidden">
          {!loading && !error && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTasks.length}</span> tasks
            </p>
          )}
        </div>
      </div>

      {/* Recommended section - separate card grid to prevent overlap */}
      {!recLoading && recommended.length > 0 && (
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-lg backdrop-blur-sm sm:p-6 dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary-500 dark:text-primary-400" />
            <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-slate-50 sm:text-lg">
              Recommended for you
            </h2>
          </div>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Based on your skills profile
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((rec) => (
              <div key={rec.task.id} className="min-h-0">
                <div className="mb-2 flex justify-end">
                  <span className="inline-flex items-center rounded-full bg-primary-500/15 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-500/40 dark:text-primary-300">
                    {rec.match_percentage}% match
                  </span>
                </div>
                <TaskCard
                  task={rec.task}
                  currentUserCollege={currentUser?.college_name}
                  showCollegeBadge
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open Tasks / All Tasks section */}
      <section className="mt-2">
        <h2 className="mb-4 text-xl font-bold font-heading text-slate-900 dark:text-slate-50 sm:text-2xl">
          {statusFilter === "all" ? "All Tasks" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Tasks`}
        </h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-300">{error}</p>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center sm:p-12 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="mb-2 font-medium text-slate-900 dark:text-slate-200">No tasks posted yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="min-w-0">
                <TaskCard
                  task={task}
                  currentUserCollege={currentUser?.college_name}
                  showCollegeBadge
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Filter Sheet Modal */}
      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sameCollegeOnly={sameCollegeOnly}
        setSameCollegeOnly={setSameCollegeOnly}
        currentUser={currentUser}
        taskCount={filteredTasks.length}
      />
    </div>
  );
};

export default Dashboard;
