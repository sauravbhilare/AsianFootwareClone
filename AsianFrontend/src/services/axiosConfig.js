import axios from "axios";
import store from "../Redux/userStore";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1",
  withCredentials: true, // Send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR - Add Token to Headers
// ============================================
api.interceptors.request.use(
  (config) => {
    console.log("🌐 REQUEST DETAILS:");
    console.log("Environment:", import.meta.env.MODE);
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    console.log("Base URL:", config.baseURL);
    console.log("Request URL:", config.url);
    console.log("Full URL:", config.baseURL + config.url);
    console.log("Method:", config.method?.toUpperCase());

    // Get token from Redux store or localStorage
    const state = store.getState();
    const token = state.user.token || localStorage.getItem("token");

    // Add token to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token added to request");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.data?.success);
    return response;
  },
  (error) => {
    // Handle cancelled/aborted requests - don't log as errors
    if (error.name === "AbortError" || error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      console.log("🚫 Request cancelled");
      return Promise.reject(error);
    }

    console.error(
      "❌ API Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.log("🔒 Unauthorized - Logging out");

      // Clear Redux state and localStorage
      import("../Redux/userStore").then(({ logout }) => {
        store.dispatch(logout());
      });

      // Redirect to login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
