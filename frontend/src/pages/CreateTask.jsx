import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTask } from "../services/api";

const CreateTask = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    reward: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    navigate("/login");
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        reward: form.reward ? Number(form.reward) : null,
        deadline: form.deadline || null
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
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-50">
          Post a task for your next deadline
        </h1>
        <p className="text-sm text-slate-400">
          Share what you&apos;re stuck on—an assignment, project, event, or club
          work—and get help from other students.
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-lg shadow-black/40">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
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
            <label className="mb-1 block text-xs font-medium text-slate-300">
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
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
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Reward (₹)
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
            className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
          >
            {loading ? "Creating..." : "Create task"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 text-xs text-slate-300 shadow-lg shadow-black/40">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Tips for clearer tasks
          </h2>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>Mention the subject, course, or club the work is for.</li>
            <li>Add links or files once someone accepts your task.</li>
            <li>Be honest about the timeline and effort.</li>
          </ul>
          <p className="text-[11px] text-slate-500">
            Clear tasks get accepted faster and lead to better collaboration
            between students.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;

