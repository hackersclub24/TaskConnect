import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Building2, Award, Mail } from "lucide-react";
import { fetchUserById, fetchUserReviews } from "../services/api";

const Profile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: userData }, { data: reviewsData }] = await Promise.all([
          fetchUserById(userId),
          fetchUserReviews(userId)
        ]);
        setUser(userData);
        setReviews(reviewsData || []);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center text-slate-400">
        Loading profile...
      </div>
    );
  }
  if (error || !user) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center text-red-300">
        {error || "User not found."}
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-500/20 text-2xl font-bold text-primary-400">
            {user.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">User Profile</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            {user.college_name && (
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <Building2 className="h-4 w-4" />
                {user.college_name}
              </p>
            )}
            {user.skills && (
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <Award className="h-4 w-4" />
                {user.skills}
              </p>
            )}
          </div>
          {avgRating && (
            <div className="ml-auto flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-semibold text-amber-300">{avgRating}</span>
              <span className="text-sm text-slate-400">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-50">Reviews</h2>
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-medium text-slate-300">
                    {r.rating}/5
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-400">
                  Reviewed by {r.reviewer_email || `User #${r.reviewer_id}`}
                </span>
              </div>
              {r.text && (
                <p className="text-sm text-slate-300">{r.text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
