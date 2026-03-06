import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => api.post("/auth/register", data);

export const loginUser = (data) => api.post("/auth/login", data);

export const fetchCurrentUser = () => api.get("/auth/me");

export const fetchTasks = () => api.get("/tasks/");

export const fetchMyTasks = () => api.get("/tasks/mine");

export const fetchTaskById = (id) => api.get(`/tasks/${id}`);

export const createTask = (data) => api.post("/tasks/", data);

export const acceptTask = (id) => api.post(`/tasks/${id}/accept`);

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

export default api;

