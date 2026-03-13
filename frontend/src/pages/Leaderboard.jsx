import { useState, useEffect } from "react";
import { Trophy, Star, Target, CheckCircle } from "lucide-react";
import { fetchLeaderboard } from "../services/api";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const { data } = await fetchLeaderboard();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError("Failed to load leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl font-heading">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Top Performers
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            See who's delivering the best results on Skillstreet.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Rank</th>
                <th scope="col" className="px-6 py-4 font-semibold">User</th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" /> Score
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Tasks Done
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4" /> Avg Rating
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 text-center">
                    {user.rank === 1 ? (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                        Top
                      </div>
                    ) : user.rank === 2 ? (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        #2
                      </div>
                    ) : user.rank === 3 ? (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-800 dark:bg-orange-900/40 dark:text-orange-400">
                        #3
                      </div>
                    ) : (
                      <span className="font-medium text-slate-500">#{user.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-200">
                      {user.name || "Anonymous"}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">
                    {user.leaderboard_score}
                  </td>
                  <td className="px-6 py-4 font-medium">{user.tasks_completed}</td>
                  <td className="px-6 py-4 font-medium flex items-center gap-1">
                    {user.average_rating > 0 && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                    {user.average_rating > 0 ? user.average_rating.toFixed(1) : "-"}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No users found for the leaderboard yet. Check back later!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
