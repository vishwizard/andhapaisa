import axios from "axios";

// Dev: Vite proxy sends "/api" → localhost backend (see vite.config.js).
// Production: set VITE_API_URL to your deployed API origin + "/api", e.g. https://api.myapp.com/api
const baseURL = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token from localStorage on init
const token = localStorage.getItem("stockverse_token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Response interceptor for 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("stockverse_token");
      localStorage.removeItem("stockverse_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;