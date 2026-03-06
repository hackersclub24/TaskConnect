import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  acceptTask,
  deleteTask,
  fetchCurrentUser,
  fetchTaskById,
  fetchTaskContacts,
  fetchRecommendedFreelancers,
  generateProposal,
  updateTask,
  updateTaskStatus
} from "../services/api";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    deadline: "",
    reward: ""
  });
  const [contacts, setContacts] = useState({
    owner_phone: null,
    acceptor_phone: null
  });
  const [recommendedFreelancers, setRecommendedFreelancers] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [proposal, setProposal] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const [
          { data: taskData },
          { data: userData },
          { data: contactsData },
          { data: recData }
        ] = await Promise.all([
          fetchTaskById(id),
          fetchCurrentUser(),
          fetchTaskContacts(id),
          fetchRecommendedFreelancers(id)
        ]);
        setTask(taskData);
        setCurrentUserId(userData.id);
        setContacts(contactsData);
        setRecommendedFreelancers(recData || []);
        setEditForm({
          title: taskData.title,
          description: taskData.description,
          deadline: taskData.deadline
            ? new Date(taskData.deadline).toISOString().slice(0, 16)
            : "",
          reward: taskData.reward != null ? String(taskData.reward) : ""
        });
      } catch {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
        setRecLoading(false);
      }
    };
    load();
  }, [id, navigate, token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      const { data } = await acceptTask(id);
      setTask(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not accept this task right now."
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        deadline: editForm.deadline || null,
        reward: editForm.reward === "" ? null : Number(editForm.reward)
      };
      const { data } = await updateTask(id, payload);
      setTask(data);
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not update this task right now."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!task || task.status === nextStatus) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await updateTaskStatus(id, nextStatus);
      setTask(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not update the status of this task right now."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this task? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await deleteTask(id);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not delete this task right now."
      );
      setDeleting(false);
    }
  };

  const handleGenerateProposal = async () => {
    setProposalLoading(true);
    setError("");
    try {
      const { data } = await generateProposal(id);
      setProposal(data.proposal || "");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not generate a proposal right now. Please try again."
      );
    } finally {
      setProposalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-400">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-red-300">
        Task not found.
      </div>
    );
  }

  const isOwner = currentUserId != null && task.owner_id === currentUserId;

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : "No deadline";

  const canAccept = task.status === "open";
  const acceptedCount = task.status === "accepted" ? 1 : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-xs text-slate-400 hover:text-slate-200"
      >
        ← Back
      </button>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-50">
            {task.title}
          </h1>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-0.5 text-xs uppercase tracking-wide text-slate-200">
            {task.status}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-300">{task.description}</p>
        <div className="mb-4 grid gap-3 text-xs text-slate-400 md:grid-cols-4">
          <div>
            <p className="text-slate-500">Deadline</p>
            <p>{deadline}</p>
          </div>
          <div>
            <p className="text-slate-500">Reward</p>
            <p>
              {task.reward
                ? `₹${Number(task.reward).toFixed(2)}`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Assigned to</p>
            <p>{task.assigned_to ? `User #${task.assigned_to}` : "Unassigned"}</p>
          </div>
          <div>
            <p className="text-slate-500">Accepted by</p>
            <p>
              {acceptedCount}{" "}
              {acceptedCount === 1 ? "freelancer" : "freelancers"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-500">Task poster contact</p>
            <p>{contacts.owner_phone || "Not provided"}</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          {!isOwner && (
            <>
              <button
                onClick={handleAccept}
                disabled={!canAccept || accepting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
              >
                {canAccept
                  ? accepting
                    ? "Accepting..."
                    : "Accept task"
                  : "Not available"}
              </button>
              <button
                onClick={handleGenerateProposal}
                disabled={proposalLoading}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                {proposalLoading ? "Generating..." : "AI proposal"}
              </button>
            </>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => setEditing((prev) => !prev)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                {editing ? "Cancel edit" : "Edit task"}
              </button>
              {task.status !== "completed" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-emerald-900/60 hover:bg-emerald-500"
                >
                  {saving && !editing ? "Updating..." : "Mark as completed"}
                </button>
              )}
              {task.status === "completed" && (
                <button
                  onClick={() => handleStatusChange("open")}
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-sky-900/60 hover:bg-sky-500"
                >
                  {saving && !editing ? "Updating..." : "Reopen task"}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
              >
                {deleting ? "Deleting..." : "Delete task"}
              </button>
              <div className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-300">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Accepted freelancer contact (only you can see this)
                </p>
                <p>
                  {contacts.acceptor_phone
                    ? contacts.acceptor_phone
                    : task.assigned_to
                    ? "The acceptor has not added a phone number yet."
                    : "No one has accepted this task yet."}
                </p>
              </div>
            </>
          )}
        </div>

        {isOwner && editing && (
          <form onSubmit={handleSaveEdits} className="mt-6 space-y-4 border-t border-slate-800 pt-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Edit your task
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={editForm.deadline}
                  onChange={handleEditChange}
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
                  value={editForm.reward}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-primary-900/60 hover:bg-primary-500"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </form>
        )}

        {!proposalLoading && proposal && !isOwner && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Generated proposal
              </h2>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(proposal)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Copy
              </button>
            </div>
            <textarea readOnly rows={6} value={proposal} />
          </div>
        )}

        {!recLoading && recommendedFreelancers.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-50">
              Recommended freelancers (AI)
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {recommendedFreelancers.slice(0, 5).map((rec) => (
                <div
                  key={rec.freelancer.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-100">
                        {rec.freelancer.email}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-slate-400">
                        Skills: {rec.freelancer.skills || "Not provided"}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full bg-primary-600/10 px-2 py-1 font-semibold text-primary-300 ring-1 ring-primary-500/30">
                      {rec.match_percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetails;

