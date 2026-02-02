import axios from "axios";

const instance = axios.create({

  // baseURL:"http://127.0.0.1:8000/api/",
  baseURL:"https://nassiq.com/backend/public/api/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    const vendorId = localStorage.getItem("vendor_id");
    if (vendorId && vendorId !== "0") {
      config.headers = config.headers || {};
      config.headers["X-Vendor-Id"] = vendorId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global auth handler: if backend says "unauthenticated", force login
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      (error?.response?.data && error.response.data.message) || "";

    const isUnauthenticatedStatus =
      status === 401 || status === 419; // 419 = CSRF/expired session

    const isUnauthenticatedMessage =
      typeof message === "string" &&
      message.toLowerCase().includes("unauthenticated");

    if (isUnauthenticatedStatus || isUnauthenticatedMessage) {
      // Clear any stored auth data
      localStorage.removeItem("token");
      localStorage.removeItem("vendor_id");
      localStorage.removeItem("user");

      // Redirect to login page
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;


