import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Building2,
  BookOpen,
  Users,
  User,
  Star,
  Copy,
  Sparkles
} from "lucide-react";
import {
  applyForTask,
  approveTaskApplication,
  cancelTaskAcceptance,
  createReview,
  deleteTask,
  fetchCurrentUser,
  fetchTaskApplications,
  fetchTaskById,
  fetchTaskContacts,
  fetchRecommendedFreelancers,
  generateProposal,
  negotiateTaskReward,
  rejectTaskApplication,
  withdrawTaskApplication,
  updateTask,
  updateTaskStatus
} from "../services/api";
import TaskChat from "../components/TaskChat";

const categoryConfig = {
  paid: { label: "Paid", icon: IndianRupee },
  learning: { label: "Learning", icon: BookOpen },
  collaboration: { label: "Collaboration", icon: Users }
};

const TaskDetails = () => {
  const { taskRef } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    deadline: "",
    reward: "",
    category: "paid",
    inter_college_only: false
  });
  const [contacts, setContacts] = useState({
    owner_phone: null,
    acceptor_phone: null
  });
  const [recommendedFreelancers, setRecommendedFreelancers] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [proposal, setProposal] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [applications, setApplications] = useState([]);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [negotiatedReward, setNegotiatedReward] = useState("");
  const [negotiatingReward, setNegotiatingReward] = useState(false);

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
          { data: recData },
          { data: applicationData }
        ] = await Promise.all([
          fetchTaskById(taskRef),
          fetchCurrentUser(),
          fetchTaskContacts(taskRef),
          fetchRecommendedFreelancers(taskRef),
          fetchTaskApplications(taskRef)
        ]);
        setTask(taskData);
        setCurrentUser(userData);
        setContacts(contactsData);
        setRecommendedFreelancers(recData || []);
        setApplications(applicationData || []);
        setNegotiatedReward(taskData.reward != null ? String(taskData.reward) : "");
        setEditForm({
          title: taskData.title,
          description: taskData.description,
          deadline: taskData.deadline
            ? new Date(taskData.deadline).toISOString().slice(0, 16)
            : "",
          reward: taskData.reward != null ? String(taskData.reward) : "",
          category: taskData.category || "paid",
          inter_college_only: taskData.inter_college_only || false
        });
      } catch {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
        setRecLoading(false);
      }
    };
    load();
  }, [taskRef, navigate, token]);

  const refreshApplications = async () => {
    try {
      const { data } = await fetchTaskApplications(taskRef);
      setApplications(data || []);
    } catch {
      // Ignore refresh failures and keep previous state
    }
  };

  const handleApply = async () => {
    setAccepting(true);
    setError("");
    try {
      await applyForTask(taskRef);
      await refreshApplications();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not apply for this task right now.");
    } finally {
      setAccepting(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!myApplication?.id) return;
    const confirmed = window.confirm("Do you want to withdraw your application for this task?");
    if (!confirmed) return;

    setAccepting(true);
    setError("");
    try {
      await withdrawTaskApplication(taskRef, myApplication.id);
      await refreshApplications();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not withdraw your request right now.");
    } finally {
      setAccepting(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await approveTaskApplication(taskRef, applicationId);
      setTask(data);
      await refreshApplications();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not approve this application right now.");
    } finally {
      setSaving(false);
    }
  };

  const openApproveConfirmation = (application) => {
    setApproveTarget(application);
  };

  const closeApproveConfirmation = () => {
    if (saving) return;
    setApproveTarget(null);
  };

  const confirmApproveApplication = async () => {
    if (!approveTarget) return;
    await handleApproveApplication(approveTarget.id);
    setApproveTarget(null);
  };

  const openRejectConfirmation = (application) => {
    setRejectTarget(application);
  };

  const closeRejectConfirmation = () => {
    if (saving) return;
    setRejectTarget(null);
  };

  useEffect(() => {
    if (!approveTarget && !rejectTarget) return;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (approveTarget) {
        closeApproveConfirmation();
      }
      if (rejectTarget) {
        closeRejectConfirmation();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [approveTarget, rejectTarget, saving]);

  const confirmRejectApplication = async () => {
    if (!rejectTarget) return;
    await handleRejectApplication(rejectTarget.id);
    setRejectTarget(null);
  };

  const handleRejectApplication = async (applicationId) => {
    setSaving(true);
    setError("");
    try {
      await rejectTaskApplication(taskRef, applicationId);
      const { data: taskData } = await fetchTaskById(taskRef);
      setTask(taskData);
      await refreshApplications();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reject this application right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAcceptance = async () => {
    const confirmed = window.confirm("Are you sure you want to cancel the acceptance of this task?");
    if (!confirmed) return;
    setSaving(true);
    setAccepting(true);
    setError("");
    try {
      const { data } = await cancelTaskAcceptance(taskRef);
      setTask(data);
      await refreshApplications();
      if (isOwner) {
         setContacts(prev => ({ ...prev, acceptor_phone: null }));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Could not cancel task acceptance right now.");
    } finally {
      setSaving(false);
      setAccepting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value
    }));
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
        reward: editForm.reward === "" ? null : Number(editForm.reward),
        category: editForm.category,
        inter_college_only: editForm.inter_college_only
      };
      const { data } = await updateTask(taskRef, payload);
      setTask(data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update this task right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!task || task.status === nextStatus) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await updateTaskStatus(taskRef, nextStatus);
      setTask(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update the status of this task right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleNegotiateReward = async () => {
    if (!task) return;

    const parsedReward = Number(negotiatedReward);
    if (negotiatedReward === "" || Number.isNaN(parsedReward) || parsedReward < 0) {
      setError("Enter a valid non-negative reward amount.");
      return;
    }

    setNegotiatingReward(true);
    setError("");
    try {
      const { data } = await negotiateTaskReward(taskRef, parsedReward);
      setTask(data);
      setNegotiatedReward(data.reward != null ? String(data.reward) : "");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update negotiated reward right now.");
    } finally {
      setNegotiatingReward(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const confirmed = window.confirm("Are you sure you want to delete this task? This cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    try {
      await deleteTask(taskRef);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete this task right now.");
      setDeleting(false);
    }
  };

  const handleGenerateProposal = async () => {
    setProposalLoading(true);
    setError("");
    try {
      const { data } = await generateProposal(taskRef);
      setProposal(data.proposal || "");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate a proposal right now. Please try again.");
    } finally {
      setProposalLoading(false);
    }
  };

  const handleSubmitReview = async (revieweeId) => {
    setReviewSubmitting(true);
    setError("");
    try {
      await createReview({
        reviewee_id: revieweeId,
        task_id: task.id,
        rating: reviewForm.rating,
        text: reviewForm.text || null
      });
      setReviewSuccess(true);
      setReviewForm({ rating: 5, text: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center text-slate-400">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center text-red-300">
        Task not found.
      </div>
    );
  }

  const isOwner = currentUser && task.owner_id === currentUser.id;
  const isAcceptor = currentUser && task.assigned_to === currentUser.id;
  // A task chat shouldn't be accessible if there is nobody to chat with (i.e. not assigned)
  const canAccessChat = task.assigned_to && (isOwner || isAcceptor);
  const canLeaveReview =
    task.status === "completed" &&
    currentUser &&
    (isOwner || isAcceptor) &&
    !reviewSuccess;
  const revieweeId = isOwner ? task.assigned_to : isAcceptor ? task.owner_id : null;

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "No deadline";

  const canAccept = task.status === "open";
  const myApplication =
    applications.find((app) => String(app.applicant_id) === String(currentUser?.id)) || null;
  const ownerPendingApplications = applications.filter((app) => app.status === "pending");
  const category = categoryConfig[task.category || "paid"] || categoryConfig.paid;
  const CategoryIcon = category.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Header with badges */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold font-heading text-slate-900 sm:text-2xl dark:text-slate-50">
            {task.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                task.status === "open"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : task.status === "accepted"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                  : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300"
              }`}
            >
              {task.status}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
              <CategoryIcon className="h-3.5 w-3.5" />
              {category.label}
            </span>
            {task.inter_college_only && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                <Building2 className="h-3.5 w-3.5" />
                Inter-College
              </span>
            )}
          </div>
        </div>

        <p className="mb-6 text-slate-700 dark:text-slate-300">{task.description}</p>

        <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400">Deadline:</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">{deadline}</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400">Reward:</span>
            <span className="font-semibold text-emerald-600 dark:font-medium dark:text-emerald-400">
              {task.reward ? `₹${Number(task.reward).toFixed(2)}` : "Not specified"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400">Posted by:</span>
            <Link
              to={`/profile/${task.owner?.slug || task.owner_id}`}
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
            >
              View profile
            </Link>
          </div>
          {task.assigned_to && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-slate-500 dark:text-slate-400">Accepted by:</span>
              <Link
                to={`/profile/${task.assigned_user?.slug || task.assigned_to}`}
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
              >
                View profile
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {task.status === "accepted" && (isOwner || isAcceptor) && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Negotiated reward
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                value={negotiatedReward}
                onChange={(e) => setNegotiatedReward(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:max-w-xs dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                placeholder="Enter final reward"
              />
              <button
                type="button"
                onClick={handleNegotiateReward}
                disabled={negotiatingReward || saving}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
              >
                {negotiatingReward ? "Updating..." : "Update reward"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              This amount can be adjusted only after a task doer is accepted.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!isOwner && (
            <>
              {task.status === "accepted" && isAcceptor ? (
                <button
                  onClick={handleCancelAcceptance}
                  disabled={saving || accepting}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200 dark:shadow-md dark:hover:bg-red-500/20"
                >
                  {accepting ? "Canceling..." : "Cancel my acceptance"}
                </button>
              ) : myApplication?.status === "pending" ? (
                <button
                  onClick={handleWithdrawApplication}
                  disabled={accepting}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-50 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                >
                  {accepting ? "Withdrawing..." : "Withdraw request"}
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={!canAccept || accepting}
                  className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-500 disabled:opacity-50"
                >
                  {!canAccept
                    ? "Not available"
                    : accepting
                    ? "Applying..."
                    : myApplication?.status === "rejected"
                    ? "Apply again"
                    : "Apply for task"}
                </button>
              )}
              <button
                onClick={handleGenerateProposal}
                disabled={proposalLoading}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {proposalLoading ? "Generating..." : "AI proposal"}
              </button>
            </>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => setEditing((p) => !p)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {editing ? "Cancel edit" : "Edit task"}
              </button>
              {task.status !== "completed" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {saving ? "Updating..." : "Mark as completed"}
                </button>
              )}
              {task.status === "completed" && (
                <button
                  onClick={() => handleStatusChange("open")}
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  Reopen task
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              {task.status === "accepted" && task.assigned_to && (
                <button
                  onClick={handleCancelAcceptance}
                  disabled={saving || accepting}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                >
                  {saving ? "Canceling..." : "Revoke assignment"}
                </button>
              )}
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Accepted freelancer contact
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {contacts.acceptor_phone ||
                    (task.assigned_to
                      ? "The acceptor has not added a phone number yet."
                      : "No one has accepted this task yet.")}
                </p>
              </div>

                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Applications ({applications.length})
                  </p>
                  {applications.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No applications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/60"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {app.applicant_name || app.applicant_email || `User #${app.applicant_id}`}
                            </p>
                            {app.applicant_email && (
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {app.applicant_email}
                              </p>
                            )}
                            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{app.status}</p>
                          </div>
                          {(task.status === "open" && app.status === "pending") && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openApproveConfirmation(app)}
                                disabled={saving}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectConfirmation(app)}
                                disabled={saving}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {task.status === "accepted" && app.status === "approved" && task.assigned_to === app.applicant_id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openRejectConfirmation(app)}
                                disabled={saving}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                              >
                                Reject accepted user
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </>
          )}
        </div>

        {/* Real-time task chat - only for owner and assigned user */}
        {canAccessChat && (
          <div className="mt-6">
            <TaskChat
              taskId={task.id}
              currentUserId={currentUser?.id}
              canAccess={canAccessChat}
            />
          </div>
        )}

        {/* Leave Review (when task completed) */}
        {canLeaveReview && revieweeId && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
              <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Leave a review
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Rating (1-5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewForm((p) => ({ ...p, rating: i }))}
                      className="rounded p-1 transition-colors hover:bg-slate-800"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          i <= reviewForm.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Comment (optional)</label>
                <textarea
                  rows={2}
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                  placeholder="How was working together?"
                  className="rounded-lg w-full bg-white border border-slate-300 text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                />
              </div>
              <button
                onClick={() => handleSubmitReview(revieweeId)}
                disabled={reviewSubmitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
              >
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        )}

        {isOwner && editing && (
          <form onSubmit={handleSaveEdits} className="mt-6 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-slate-100">Edit task</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Category</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                >
                  <option value="paid">Paid</option>
                  <option value="learning">Learning</option>
                  <option value="collaboration">Collaboration</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  name="inter_college_only"
                  checked={editForm.inter_college_only}
                  onChange={handleEditChange}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <label className="text-sm text-slate-700 dark:text-slate-300">Inter-College Work only</label>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Deadline</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={editForm.deadline}
                  onChange={handleEditChange}
                  className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Reward (₹)</label>
                <input
                  type="number"
                  name="reward"
                  min="0"
                  step="0.01"
                  value={editForm.reward}
                  onChange={handleEditChange}
                  className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-200"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {!proposalLoading && proposal && !isOwner && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">Generated proposal</h3>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(proposal)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:shadow-none"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <textarea readOnly rows={6} value={proposal} className="w-full rounded-lg bg-white border border-slate-300 text-slate-700 px-3 py-2 text-sm dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-300 custom-scrollbar" />
          </div>
        )}

        {!recLoading && recommendedFreelancers.length > 0 && isOwner && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
              <Sparkles className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              Recommended freelancers
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendedFreelancers.slice(0, 4).map((rec) => (
                <Link
                  key={rec.freelancer.id}
                  to={`/profile/${rec.freelancer.slug || rec.freelancer.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-800/50 dark:shadow-none"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {rec.freelancer.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rec.freelancer.skills || "No skills listed"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600 dark:bg-primary-600/20 dark:text-primary-300">
                    {rec.match_percentage}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {approveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          onClick={closeApproveConfirmation}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold font-heading text-slate-900 dark:text-slate-100">
              Confirm assignee
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to assign this task to{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {approveTarget.applicant_name || approveTarget.applicant_email || `User #${approveTarget.applicant_id}`}
              </span>
              ?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This will mark the task as accepted and notify this applicant.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeApproveConfirmation}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApproveApplication}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          onClick={closeRejectConfirmation}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold font-heading text-slate-900 dark:text-slate-100">
              Confirm rejection
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to reject{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {rejectTarget.applicant_name || rejectTarget.applicant_email || `User #${rejectTarget.applicant_id}`}
              </span>
              ?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {task?.status === "accepted" && rejectTarget.status === "approved"
                ? "This will remove the current assignee and reopen the task."
                : "This applicant will no longer be considered for this task."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRejectConfirmation}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejectApplication}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? "Rejecting..." : "Confirm reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
