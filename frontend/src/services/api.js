import axios from "axios";

// Local development uses the backend running on the same computer unless a
// VITE_API_URL value is explicitly configured.
const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "https://expense-management-8ozj.onrender.com"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("expense-ai-auth");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem("expense-ai-auth");
    }
  }
  return config;
});

export default api;
