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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold text-slate-50">
        Create a new task
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Describe what you need help with and set a reward.
      </p>
      {error && (
        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={4}
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
    </div>
  );
};

export default CreateTask;

