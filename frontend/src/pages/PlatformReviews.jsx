import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, Send } from "lucide-react";
import { createPlatformReview, fetchPlatformReviews } from "../services/api";

/**
 * Platform Reviews page - what other people write about Skillstreet.
 * Users can read reviews and submit their own.
 */
const PlatformReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchPlatformReviews();
        setReviews(data || []);
      } catch {
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to write a review.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await createPlatformReview({ rating, review_text: reviewText });
      setSuccess("Thank you! Your review has been posted.");
      setReviewText("");
      setRating(5);
      const { data } = await fetchPlatformReviews();
      setReviews(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 sm:text-3xl">
          What people say about Skillstreet
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Read what others think and share your own experience.
        </p>
        {avgRating && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-100/80 px-4 py-2 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-0">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">{avgRating}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">average ({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {/* Write your own review */}
      <div className="mb-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Write your review</h2>
        {!token ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please{" "}
            <Link to="/login" className="font-medium text-primary-400 hover:underline">
              log in
            </Link>{" "}
            to share what you think about Skillstreet.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                {success}
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Your rating (1–5 stars)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Your review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                rows={4}
                placeholder="Share your experience with Skillstreet..."
                className="w-full rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Posting..." : "Post review"}
            </button>
          </form>
        )}
      </div>


      {/* List of reviews from others */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Reviews from the community</h2>
      {loading ? (
        <p className="py-8 text-center text-slate-600 dark:text-slate-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          No reviews yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white/85 p-5 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-none"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">{r.rating}/5</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {r.user_email || `User #${r.user_id}`} •{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{r.review_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformReviews;
