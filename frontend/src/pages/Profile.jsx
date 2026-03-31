import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Building2, Award, Mail, Edit2, Save, X, Briefcase, CheckCircle, Clock, Coins, Crown } from "lucide-react";
import { fetchUserById, fetchUserReviews, fetchUserStats, updateUserProfile, fetchCurrentUser, fetchCollegeSuggestions } from "../services/api";
import ProfileImageUpload from "../components/ProfileImageUpload";

const Profile = () => {
  const { userRef } = useParams();
  
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    skills: "",
    college_name: ""
  });
  const [collegeSuggestions, setCollegeSuggestions] = useState([]);
  
  const [activeTab, setActiveTab] = useState("posted"); // 'posted' or 'accepted'

  const handleImageUpdate = (newImageUrl) => {
    setUser(prev => ({ ...prev, profile_image_url: newImageUrl }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // fetch current user just to know if we own this profile
        const [
          { data: userData },
          { data: reviewsData },
          { data: statsData }
        ] = await Promise.all([
          fetchUserById(userRef),
          fetchUserReviews(userRef),
          fetchUserStats(userRef)
        ]);

        let current = null;
        try {
          const { data } = await fetchCurrentUser();
          current = data;
        } catch {
          // ignore if not logged in
        }

        setUser(userData);
        setCurrentUser(current);
        setReviews(reviewsData || []);
        setStats(statsData);
        setEditForm({
          name: userData.name || "",
          bio: userData.bio || "",
          skills: userData.skills || "",
          college_name: userData.college_name || ""
        });
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userRef]);

  const isOwner = currentUser && user && String(currentUser.id) === String(user.id);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!isEditing) return;
    const term = (editForm.college_name || "").trim();

    const timer = setTimeout(async () => {
      try {
        const { data } = await fetchCollegeSuggestions(term);
        setCollegeSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setCollegeSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editForm.college_name, isEditing]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await updateUserProfile(editForm);
      setUser(data);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center text-slate-400">
        Loading profile dashboard...
      </div>
    );
  }
  if (error || !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center text-red-300">
        {error || "User not found."}
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      
      {/* 1. Profile Info & Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative overflow-hidden dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Abstract background blobs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start text-center sm:text-left">
            {isOwner ? (
              <ProfileImageUpload
                currentImageUrl={user.profile_image_url}
                onImageUpdate={handleImageUpdate}
                userName={user.name || user.email}
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-primary-500/20 text-4xl font-bold text-primary-400 shadow-inner">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url.startsWith("/") ? `http://127.0.0.1:8000${user.profile_image_url}` : user.profile_image_url}
                    alt={user.name}
                    className="w-24 h-24 rounded-3xl object-cover"
                  />
                ) : (
                  (user.name && user.name[0]?.toUpperCase()) || user.email[0]?.toUpperCase() || "?"
                )}
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                {user.name || "User Profile"}
              </h1>
              <p className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {user.email}
              </p>
              {user.college_name && (
                <p className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {user.college_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
            {avgRating && (
              <div className="flex w-full items-center justify-center sm:justify-end gap-1.5 rounded-xl bg-amber-500/10 px-4 py-2 border border-amber-500/20">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold text-amber-300">{avgRating}</span>
                <span className="text-sm font-medium text-slate-400 text-nowrap">({reviews.length} reviews)</span>
              </div>
            )}
            {isOwner && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-sm font-medium transition-colors text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Edit Form or Bio display */}
        <div className="relative z-10 mt-8 border-t border-slate-200 pt-6 dark:border-slate-800/60">
          {isEditing ? (
            <div className="space-y-4 max-w-2xl bg-slate-50 p-5 rounded-xl border border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold font-heading text-primary-600 uppercase tracking-wider dark:text-primary-400">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Display Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-primary-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Bio / Description</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-primary-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 dark:text-slate-400">Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={editForm.skills}
                    onChange={handleEditChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-primary-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    placeholder="Python, UI Design, Video Editing"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 dark:text-slate-400">College</label>
                  <input
                    type="text"
                    name="college_name"
                    value={editForm.college_name}
                    onChange={handleEditChange}
                    list="college-suggestions"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-primary-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    placeholder="Start typing your college name"
                  />
                  <datalist id="college-suggestions">
                    {collegeSuggestions.map((college) => (
                      <option key={college} value={college} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2 dark:text-slate-500">About Me</h3>
                  {user.bio ? (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap dark:text-slate-300">{user.bio}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic dark:text-slate-500">This user hasn't added a bio yet.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2 dark:text-slate-500">Skills</h3>
                {user.skills ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.split(',').map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-xs font-medium text-sky-300">
                        <Award className="h-3 w-3" />
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No skills added.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 2. User Statistics (Sidebar) */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold font-heading text-slate-900 mb-4 flex items-center gap-2 dark:text-slate-50">
              <Briefcase className="h-5 w-5 text-primary-500 dark:text-primary-400" />
              Statistics
            </h2>
            {stats ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group transition-colors hover:border-emerald-300 shadow-sm dark:bg-slate-950/50 dark:border-slate-800/80 dark:hover:border-primary-500/30 dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors dark:text-slate-300 dark:group-hover:text-slate-200">Completed</span>
                  </div>
                  <span className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">{stats.total_completed}</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group transition-colors hover:border-sky-300 shadow-sm dark:bg-slate-950/50 dark:border-slate-800/80 dark:hover:border-primary-500/30 dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors dark:text-slate-300 dark:group-hover:text-slate-200">Posted</span>
                  </div>
                  <span className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">{stats.total_posted}</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group transition-colors hover:border-amber-300 shadow-sm dark:bg-slate-950/50 dark:border-slate-800/80 dark:hover:border-primary-500/30 dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors dark:text-slate-300 dark:group-hover:text-slate-200">Accepted</span>
                  </div>
                  <span className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">{stats.total_accepted}</span>
                </div>

                {user.is_premium && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group transition-colors hover:border-yellow-300 shadow-sm dark:bg-slate-950/50 dark:border-slate-800/80 dark:hover:border-primary-500/30 dark:shadow-none">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
                        <Crown className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors dark:text-slate-300 dark:group-hover:text-slate-200">Premium Tokens</span>
                    </div>
                    <span className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">{user.premium_tokens || 0}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl" />)}
              </div>
            )}
          </div>
          
          {/* Reviews (moved to bottom of sidebar or keep here depending on size) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex-1 flex flex-col dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold font-heading text-slate-900 mb-4 flex items-center gap-2 dark:text-slate-50">
              <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              Recent Reviews
            </h2>
            {reviews.length === 0 ? (
              <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-100/40 p-6 flex items-center justify-center text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                No reviews yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/50">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider dark:text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.text && <p className="text-xs text-slate-700 mt-1 line-clamp-3 dark:text-slate-300">{r.text}</p>}
                    <p className="mt-2 text-[10px] text-slate-400 font-medium text-right dark:text-slate-500">
                      - {r.reviewer_email || `User #${r.reviewer_id}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Task History */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-1 h-full flex flex-col dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex p-2 bg-slate-200/50 rounded-xl mb-4 mx-4 mt-4 relative z-20 dark:bg-slate-950/50 dark:border dark:border-slate-800/50">
              <button 
                onClick={() => setActiveTab('posted')}
                className={`flex-1 flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'posted' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'}`}
              >
                Posted Tasks
              </button>
              <button 
                onClick={() => setActiveTab('accepted')}
                className={`flex-1 flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'accepted' ? 'bg-sky-500 text-white shadow-lg shadow-sky-900/20 dark:bg-sky-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'}`}
              >
                Accepted Tasks
              </button>
            </div>
            
            <div className="px-5 pb-5 flex-1 relative z-20">
              {!stats ? (
                <div className="h-64 flex items-center justify-center text-slate-500">Loading history...</div>
              ) : (
                <div className="space-y-3">
                  {activeTab === 'posted' && stats.posted_tasks.length === 0 && (
                    <p className="text-center text-sm py-12 text-slate-500 border border-dashed border-slate-300 bg-slate-100/40 rounded-xl dark:border-slate-700/50 dark:bg-slate-950/20">No tasks posted yet.</p>
                  )}
                  {activeTab === 'accepted' && stats.accepted_tasks.length === 0 && (
                    <p className="text-center text-sm py-12 text-slate-500 border border-dashed border-slate-300 bg-slate-100/40 rounded-xl dark:border-slate-700/50 dark:bg-slate-950/20">No tasks accepted yet.</p>
                  )}
                  
                  {(activeTab === 'posted' ? stats.posted_tasks : stats.accepted_tasks).map(task => (
                    <Link 
                      key={task.id} 
                      to={`/tasks/${task.slug || task.id}`}
                      className="block bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm dark:bg-slate-900/40 dark:border-slate-800/80 dark:hover:border-slate-700 dark:hover:bg-slate-800/40 dark:shadow-none"
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-semibold font-heading text-slate-900 line-clamp-1 group-hover:text-primary-600 dark:text-slate-200">{task.title}</h4>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          task.status === "open"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : task.status === "accepted"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
                            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-400"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed dark:text-slate-400">{task.description}</p>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                         <span>{new Date(task.created_at).toLocaleDateString()}</span>
                         {task.reward && (
                           <span className="font-semibold text-emerald-600 dark:text-emerald-400/80 dark:font-medium">₹{task.reward}</span>
                         )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
