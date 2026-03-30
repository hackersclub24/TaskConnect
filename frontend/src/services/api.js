import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://taskconnect-pyxy.onrender.com/api";
  // import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL
});

const GOOGLE_AUTH_URL =
  import.meta.env.VITE_GOOGLE_AUTH_URL || `${API_ORIGIN}/api/auth/google`;
  
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => api.post("/auth/register", data);

export const loginUser = (data) => api.post("/auth/login", data);

export const loginWithGoogleToken = async (idToken) => {
  const fallbackUrl = `${API_ORIGIN}/api/auth/google`;
  const urlsToTry = [GOOGLE_AUTH_URL, fallbackUrl].filter(
    (url, index, arr) => url && arr.indexOf(url) === index
  );

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      return await axios.post(url, { token: idToken });
    } catch (err) {
      lastError = err;
      // If backend responded (4xx/5xx), don't retry a different URL.
      if (axios.isAxiosError(err) && err.response) {
        throw err;
      }
    }
  }

  throw lastError;
};

export const fetchCurrentUser = () => api.get("/auth/me");

// Tasks - category: paid|learning|collaboration, same_college_only: bool
export const fetchTasks = (params = {}) => api.get("/tasks/", { params });

export const fetchUrgentTasks = () => api.get("/tasks/urgent");

export const fetchMyTasks = () => api.get("/tasks/mine");

export const fetchTaskById = (id) => api.get(`/tasks/${id}`);

export const createTask = (data) => api.post("/tasks/", data);

export const applyForTask = (id) => api.post(`/tasks/${id}/apply`);

// Backward-compatible alias used by older UI code.
export const acceptTask = (id) => applyForTask(id);

export const fetchTaskApplications = (id) => api.get(`/tasks/${id}/applications`);

export const approveTaskApplication = (taskId, applicationId) =>
  api.post(`/tasks/${taskId}/applications/${applicationId}/approve`);

export const rejectTaskApplication = (taskId, applicationId) =>
  api.post(`/tasks/${taskId}/applications/${applicationId}/reject`);

export const withdrawTaskApplication = (taskId, applicationId) =>
  api.delete(`/tasks/${taskId}/applications/${applicationId}`);

export const cancelTaskAcceptance = (id) => api.post(`/tasks/${id}/cancel-acceptance`);

export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);

export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });

export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const fetchTaskContacts = (id) => api.get(`/tasks/${id}/contacts`);

export const fetchRecommendedFreelancers = (id) =>
  api.get(`/tasks/${id}/recommended-freelancers`);

export const generateProposal = (id) => api.post(`/tasks/${id}/proposal`);

export const fetchRecommendedTasks = (userId) =>
  api.get(`/users/${userId}/recommended-tasks`);

export const fetchUserById = (userId) => api.get(`/users/${userId}`);

export const updateUserProfile = (data) => api.patch("/users/me", data);

export const fetchCollegeSuggestions = (query = "") =>
  api.get("/users/colleges", { params: { q: query } });

export const fetchUserStats = (userId) => api.get(`/users/${userId}/stats`);

// Reviews
export const createReview = (data) => api.post("/reviews/", data);
export const fetchUserReviews = (userId) => api.get(`/reviews/user/${userId}`);

// Leaderboard
export const fetchLeaderboard = (timeframe = "global", filter = "all") => 
  api.get(`/leaderboard?timeframe=${timeframe}&filter=${filter}`);

// Contact / Feedback
export const submitContactFeedback = (data) => api.post("/contact/", data);

// Platform reviews (what people write about the platform)
export const fetchPlatformReviews = () => api.get("/platform-reviews/");
export const createPlatformReview = (data) => api.post("/platform-reviews/", data);

// Chat messages (REST for history)
// WebSocket URL: derive from API base (http://127.0.0.1:8000/api -> ws://127.0.0.1:8000/api)
const getWsBase = () => {
  const env = import.meta.env.VITE_WS_URL || API_BASE_URL;
  if (!env) return "ws://localhost:8000/api";
  const wsBase = env.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return wsBase;
};
export const getChatWebSocketUrl = (taskId) => {
  const token = localStorage.getItem("token");
  const base = getWsBase();
  const tokenParam = token ? `token=${encodeURIComponent(token)}` : "";
  return `${base}/chat/${taskId}${tokenParam ? `?${tokenParam}` : ""}`;
};
export const fetchTaskMessages = (taskId) => api.get(`/tasks/${taskId}/messages`);
export const markTaskMessagesSeen = (taskId) => api.post(`/chat/${taskId}/seen`);

// PDF upload to chat
export const uploadPdfToChat = (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/chat/${taskId}/upload-pdf`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

// Image upload to chat
export const uploadImageToChat = (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/chat/${taskId}/upload-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

// Premium features
export const getTokenBalance = () => api.get("/premium/token-balance");
export const unlockAIResumeReview = () => api.post("/premium/ai-resume-review");
export const unlockPriorityMatching = () => api.post("/premium/priority-matching");
export const checkPremiumAccess = (feature) => api.get(`/premium/check/${feature}`);

// Cloudinary profile image
export const updateProfileImage = (imageUrl) =>
  api.patch("/users/me", { profile_image_url: imageUrl });

export default api;

