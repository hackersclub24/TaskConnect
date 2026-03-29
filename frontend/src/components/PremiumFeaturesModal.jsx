import { X, Zap, Brain, Wand2, Crown, AlertCircle } from "lucide-react";
import { useState } from "react";
import { unlockAIResumeReview, unlockPriorityMatching } from "../services/api";

const PremiumFeaturesModal = ({ isOpen, onClose, tokenBalance, isPremium }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isComingSoon = true;
  const features = [
    {
      id: "ai-resume-review",
      title: "AI Resume Review",
      description: "Get AI-powered feedback on your resume to improve your freelancer profile",
      cost: 10,
      icon: Brain
    },
    {
      id: "priority-matching",
      title: "Priority Task Matching",
      description: "Get matched with high-paying tasks first with advanced algorithms",
      cost: 5,
      icon: Wand2
    },
    {
      id: "early-access",
      title: "Early Task Access",
      description: "View tasks 5 minutes before other users (included with premium status)",
      cost: 0,
      icon: Zap,
      premium: true
    }
  ];

  const handleUnlock = async (featureId, cost) => {
    if (tokenBalance < cost) {
      setError(`Not enough tokens! You need ${cost} tokens but have ${tokenBalance}`);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      let response;
      if (featureId === "ai-resume-review") {
        response = await unlockAIResumeReview();
      } else if (featureId === "priority-matching") {
        response = await unlockPriorityMatching();
      }

      setMessage(`✓ ${features.find(f => f.id === featureId).title} unlocked!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to unlock feature. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto dark:border-slate-800 dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-primary-600 to-sky-600 px-6 py-4 dark:border-slate-800 dark:from-primary-700 dark:to-sky-700">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Premium Features</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {message && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">
              <Zap className="h-5 w-5" />
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            <p className="font-medium">Your Balance: <span className="text-amber-600 dark:text-amber-400 font-bold">{tokenBalance} tokens</span></p>
          </div>

          <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
            Premium unlocks are coming soon. You can preview features for now.
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end">
              <span className="mt-2 mr-2 rounded-full border border-slate-300 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200">
                Coming Soon
              </span>
            </div>

            <div className="space-y-3 blur-[1.5px] opacity-90">
            {features.map((feature) => {
              const Icon = feature.icon;
              const canAfford = tokenBalance >= feature.cost;
              const isEarlyAccess = feature.id === "early-access";
              const isDisabled = isComingSoon || loading || !canAfford || (isEarlyAccess && !isPremium);

              return (
                <div
                  key={feature.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50">{feature.title}</h3>
                        {feature.premium && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">
                            <Crown className="h-3 w-3" />
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {feature.cost > 0 && (
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                          <span>-{feature.cost}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleUnlock(feature.id, feature.cost)}
                        disabled={isDisabled}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          isComingSoon
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                            : isEarlyAccess && !isPremium
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                            : feature.cost === 0
                            ? "bg-slate-200 text-slate-600 cursor-not-allowed dark:bg-slate-700 dark:text-slate-300"
                            : canAfford
                            ? "bg-primary-600 text-white hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                        }`}
                      >
                        {isComingSoon ? "Coming Soon" : loading ? "Processing..." : isEarlyAccess && !isPremium ? "Premium Only" : feature.cost === 0 ? "Included" : "Unlock"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeaturesModal;
