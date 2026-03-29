import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, IndianRupee, BookOpen, Users, Briefcase, Building2, AlertCircle } from "lucide-react";
import { createTask } from "../services/api";

const CATEGORIES = [
  { value: "paid", label: "Paid Task", icon: IndianRupee, desc: "Offer payment for completed work" },
  { value: "learning", label: "Learning Help", icon: BookOpen, desc: "Request help learning a skill" },
  { value: "collaboration", label: "Collaboration", icon: Users, desc: "Find partners for projects" }
];

const CreateTask = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    reward: "",
    category: "paid",
    inter_college_only: false,
    is_urgent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        reward: form.reward ? Number(form.reward) : null,
        deadline: form.deadline || null,
        category: form.category,
        inter_college_only: form.inter_college_only,
        is_urgent: form.is_urgent
      };
      await createTask(payload);
      navigate("/");
    } catch (err) {
      setError("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Post a task for your next deadline
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Share what you&apos;re stuck on—an assignment, project, event, or club
          work—and get help from other students.
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl shadow-black/40"
        >
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileText className="h-3.5 w-3.5" />
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Quick design review, bug fix, etc."
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Add enough detail so someone can help you effectively."
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300">
              Category
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = form.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                      isSelected
                        ? "border-primary-600 bg-primary-600/40 text-primary-100"
                        : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 transition-colors hover:bg-slate-800/60">
              <input
                type="checkbox"
                name="inter_college_only"
                checked={form.inter_college_only}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-600"
              />
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Inter-College Work only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 transition-colors hover:bg-red-500/20">
              <input
                type="checkbox"
                name="is_urgent"
                checked={form.is_urgent}
                onChange={handleChange}
                className="h-4 w-4 rounded border-red-500/50 text-red-500 focus:ring-red-500"
              />
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-200">Mark as Urgent Task</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
                <Calendar className="h-3.5 w-3.5" />
                Deadline
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300">
                <IndianRupee className="h-3.5 w-3.5" />
                Reward (₹) — for paid tasks
              </label>
              <input
                type="number"
                name="reward"
                min="0"
                step="0.01"
                value={form.reward}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-500 disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Creating..." : "Create task"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 text-sm text-slate-300 shadow-lg">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-100">
            <Briefcase className="h-4 w-4" />
            Tips for clearer tasks
          </h2>
          <ul className="mb-4 space-y-2 pl-1">
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Mention the subject, course, or club the work is for.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Add links or files once someone accepts your task.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Be honest about the timeline and effort.
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Clear tasks get accepted faster and lead to better collaboration
            between students.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;
