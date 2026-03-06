import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Filter, GraduationCap, Sparkles } from "lucide-react";
import { fetchCurrentUser, fetchRecommendedTasks, fetchTasks } from "../services/api";
import TaskCard from "../components/TaskCard";

const CATEGORY_TABS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid Tasks" },
  { value: "learning", label: "Learning Help" },
  { value: "collaboration", label: "Collaboration" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sameCollegeOnly, setSameCollegeOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);

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

        const [{ data: tasksData }, { data: meData }] = await Promise.all([
          fetchTasks(params),
          fetchCurrentUser()
        ]);
        setTasks(tasksData);
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

  const filteredTasks = tasks.filter((t) =>
    statusFilter === "all" ? true : t.status === statusFilter
  );

  return (
    <div className="py-6">
      {/* Hero section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Tasks from students like you
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Trade skills to finish assignments, club work, and side projects
            before the deadline.
          </p>
        </div>
        <button
          onClick={() => navigate("/create-task")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition-all hover:bg-primary-500 hover:shadow-primary-900/50"
        >
          <PlusCircle className="h-5 w-5" />
          Post a new task
        </button>
      </div>

      {/* Recommended section */}
      {!recLoading && recommended.length > 0 && (
        <div className="mb-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-400" />
            <h2 className="text-base font-semibold text-slate-50">
              Recommended for you
            </h2>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            Based on your skills profile
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((rec) => (
              <div key={rec.task.id} className="relative">
                <div className="absolute right-3 top-3 z-10 rounded-full bg-primary-600/20 px-2.5 py-1 text-xs font-semibold text-primary-300 ring-1 ring-primary-500/40">
                  {rec.match_percentage}% match
                </div>
                <TaskCard
                  task={rec.task}
                  currentUserCollege={currentUser?.college_name}
                  showCollegeBadge
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Category:</span>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {currentUser?.college_name && (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs transition-colors hover:bg-slate-800">
              <input
                type="checkbox"
                checked={sameCollegeOnly}
                onChange={(e) => setSameCollegeOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded"
              />
              <GraduationCap className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">From my college only</span>
            </label>
          )}
          <div className="flex items-center gap-1.5">
            {["all", "open", "accepted", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  statusFilter === s
                    ? s === "open"
                      ? "bg-emerald-600/90 text-white"
                      : s === "accepted"
                      ? "bg-amber-500/90 text-slate-950"
                      : s === "completed"
                      ? "bg-sky-500/90 text-slate-950"
                      : "bg-slate-700 text-slate-50"
                    : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {!loading && !error && (
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filteredTasks.length}</span> tasks
          </p>
        )}
      </div>

      {/* Task grid */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading tasks...</p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
          <p className="mb-2 font-medium text-slate-200">No tasks posted yet.</p>
          <p className="text-sm text-slate-400">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserCollege={currentUser?.college_name}
              showCollegeBadge
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
