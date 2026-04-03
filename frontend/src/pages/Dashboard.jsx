import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Filter, GraduationCap, Sparkles } from "lucide-react";
import {
  fetchCurrentUser,
  fetchMyTasks,
  fetchRecommendedTasks,
  fetchTasks,
  fetchUrgentTasks
} from "../services/api";
import TaskCard from "../components/TaskCard";
import FilterSheet, { FilterButton } from "../components/FilterSheet";

const STATUS_LABELS = {
  all: "All tasks",
  open: "Open tasks",
  accepted: "Accepted tasks",
  completed: "Completed tasks"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [sameCollegeOnly, setSameCollegeOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [{ data: meData }, { data: urgentTasksData }] = await Promise.all([
          fetchCurrentUser(),
          fetchUrgentTasks()
        ]);

        const params = {};
        if (sameCollegeOnly && !myTasksOnly) params.same_college_only = true;

        const tasksResponse = myTasksOnly ? await fetchMyTasks() : await fetchTasks(params);
        setTasks(tasksResponse.data || []);
        setUrgentTasks(urgentTasksData || []);
        setCurrentUser(meData);

        try {
          const { data: recData } = await fetchRecommendedTasks(meData.id);
          setRecommended(recData || []);
        } catch {
          setRecommended([]);
        } finally {
          setRecLoading(false);
        }
      } catch {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, token, sameCollegeOnly, myTasksOnly]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const urgentTaskIds = new Set((urgentTasks || []).map((task) => task.task_id));

  const baseFilteredTasks = tasks.filter((task) =>
    statusFilter === "all" ? true : task.status === statusFilter
  );

  const filteredTasks = statusFilter === "open"
    ? [...baseFilteredTasks].sort((a, b) => {
        const aPriority = urgentTaskIds.has(a.id) ? 0 : 1;
        const bPriority = urgentTaskIds.has(b.id) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.created_at) - new Date(a.created_at);
      })
    : [...baseFilteredTasks].sort((a, b) => {
        if (myTasksOnly) {
          const aPriority = a.status === "accepted" ? 0 : 1;
          const bPriority = b.status === "accepted" ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

  const activeFilterCount =
    Number(myTasksOnly) + Number(sameCollegeOnly) + Number(!["open", "all"].includes(statusFilter));

  const activeFilterSummary = [
    STATUS_LABELS[statusFilter] || "Tasks",
    myTasksOnly ? "My Tasks" : null,
    sameCollegeOnly ? "My College" : null
  ].filter(Boolean);

  const clearFilters = () => {
    setStatusFilter("open");
    setMyTasksOnly(false);
    setSameCollegeOnly(false);
  };

  return (
    <div className="py-6 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 sm:text-4xl">
            Tasks from students like you
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Trade skills to finish assignments, club work, and side projects before the deadline.
          </p>
        </div>
        <button
          onClick={() => navigate("/create-task")}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 transition-all hover:-translate-y-0.5 hover:bg-primary-500 hover:shadow-primary-900/40 dark:shadow-primary-900/40 dark:hover:shadow-primary-900/50"
        >
          <PlusCircle className="h-5 w-5" />
          Post a new task
        </button>
      </div>

      <div className="mb-6 space-y-3 border-y border-slate-200/70 py-3 dark:border-slate-800/80">
        <div className="md:hidden flex items-center gap-3">
          <Filter className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <FilterButton onClick={() => setFilterSheetOpen(true)} taskCount={filteredTasks.length} />
        </div>

        <div className="relative hidden md:block" ref={filterMenuRef}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                  filterMenuOpen
                    ? "border-primary-300 bg-primary-50 text-primary-700 shadow-primary-900/10 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-200"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="hidden xl:block text-xs text-slate-500 dark:text-slate-400">
                {activeFilterSummary.join(" · ")}
              </p>
            </div>

            {!loading && !error && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTasks.length}</span> tasks
              </p>
            )}
          </div>

          {filterMenuOpen && (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 w-[min(30rem,calc(100vw-4rem))] rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Task filters</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Narrow the feed without making the page feel crowded.
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "open", label: "Open" },
                      { value: "accepted", label: "Accepted" },
                      { value: "completed", label: "Completed" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                          statusFilter === option.value
                            ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm shadow-primary-900/5 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-200"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Scope
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        setMyTasksOnly((prev) => {
                          const next = !prev;
                          if (next) setStatusFilter("all");
                          return next;
                        });
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        myTasksOnly
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm shadow-primary-900/5 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      My Tasks
                    </button>

                    <button
                      onClick={clearFilters}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Clear filters
                    </button>
                  </div>

                  {currentUser?.college_name && (
                    <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={sameCollegeOnly}
                        onChange={(e) => setSameCollegeOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 accent-primary-600"
                      />
                      <GraduationCap className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">From my college only</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accepted tasks stay pinned in My Tasks. Urgent tasks stay at the top of Open.
                </p>
                <button
                  onClick={() => setFilterMenuOpen(false)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:hidden">
          {!loading && !error && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTasks.length}</span> tasks
            </p>
          )}
        </div>
      </div>

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
                <TaskCard task={rec.task} currentUserCollege={currentUser?.college_name} showCollegeBadge />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-2">
        <h2 className="mb-4 text-xl font-bold font-heading text-slate-900 dark:text-slate-50 sm:text-2xl">
          {myTasksOnly ? "My Tasks" : STATUS_LABELS[statusFilter] || "Tasks"}
        </h2>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-300">{error}</p>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-white/70 to-slate-50/50 p-8 text-center shadow-sm sm:p-12 dark:border-slate-700 dark:from-slate-950/40 dark:to-slate-900/40">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              <Filter className="h-5 w-5" />
            </div>
            <p className="mb-2 font-semibold text-slate-900 dark:text-slate-200">
              {statusFilter === "open" ? "No open tasks match these filters." : "No tasks match these filters."}
            </p>
            <p className="mx-auto max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Try clearing one filter or post a new task if you want fresh results.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={clearFilters}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>
              <button
                onClick={() => navigate("/create-task")}
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
              >
                Create task
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="min-w-0">
                <TaskCard task={task} currentUserCollege={currentUser?.college_name} showCollegeBadge />
              </div>
            ))}
          </div>
        )}
      </section>

      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        myTasksOnly={myTasksOnly}
        setMyTasksOnly={setMyTasksOnly}
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
