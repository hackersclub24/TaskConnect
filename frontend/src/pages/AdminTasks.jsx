import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, RefreshCcw, Search, Trash2 } from "lucide-react";
import { adminDeleteTask, fetchAdminTasks, fetchCurrentUser } from "../services/api";

const AdminTasks = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadTasks = async (searchText = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchAdminTasks({ q: searchText || undefined, limit: 200 });
      setItems(data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const me = await fetchCurrentUser();
        const nextIsAdmin = Boolean(me?.data?.is_admin);
        setIsAdmin(nextIsAdmin);
        if (nextIsAdmin) {
          await loadTasks();
        }
      } catch {
        setIsAdmin(false);
      }
    };

    bootstrap();
  }, []);

  const handleDelete = async (task) => {
    const confirmed = window.confirm(
      `Delete task \"${task.title}\"? This will remove task, chat history in DB, and uploaded chat files from Cloudinary.`
    );
    if (!confirmed) return;

    setDeletingId(task.id);
    setError("");
    try {
      await adminDeleteTask(task.slug || task.id);
      setItems((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items]);

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Admin Task Cleanup Panel</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Delete tasks from here to ensure related chat records and uploaded files are cleaned correctly.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, slug, or owner email"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={() => loadTasks(query)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={() => {
              setQuery("");
              loadTasks("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Task</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Loading tasks...</td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No tasks found.</td>
                </tr>
              ) : (
                sortedItems.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{task.title}</div>
                      <div className="text-xs text-slate-500">#{task.id} · {task.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{task.owner_email || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{task.status}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {task.message_count} msgs · {task.attachment_count} files
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(task)}
                        disabled={deletingId === task.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/70 dark:text-red-300 dark:hover:bg-red-950/50"
                      >
                        {deletingId === task.id ? (
                          <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Use this only when necessary. Deletion is permanent and removes associated chat records and uploaded task-chat files.
        </p>
      </div>
    </section>
  );
};

export default AdminTasks;
