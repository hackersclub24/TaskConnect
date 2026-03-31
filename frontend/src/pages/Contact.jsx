import { useState } from "react";
import { MessageCircle, Send, AlertCircle, Mail, MessageSquare } from "lucide-react";
import { submitContactFeedback } from "../services/api";

const FEEDBACK_TYPES = [
  { value: "feedback", label: "General Feedback", icon: MessageSquare },
  { value: "report", label: "Report Issue", icon: AlertCircle },
  { value: "contact", label: "Contact Team", icon: Mail }
];

const Contact = () => {
  const [form, setForm] = useState({
    type: "feedback",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await submitContactFeedback(form);
      setSuccess("Thank you! Your message has been sent. We'll get back to you soon.");
      setForm({ type: "feedback", subject: "", message: "" });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || d).join(", ")
        : typeof detail === "string"
        ? detail
        : "Failed to send. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Contact & Feedback</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Send feedback, report issues, or get in touch with the Skillstreet team.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Type
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FEEDBACK_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              placeholder="Brief subject line"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Message
            </label>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
              placeholder="Describe your feedback, issue, or query in detail..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary-500 disabled:opacity-50 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
