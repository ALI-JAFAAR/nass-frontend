import { defineStore } from "pinia";
import axiosInstance from "@/api/axios";

interface User {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  vendor_id?: number | null;
  vendor_type?: string | null;
  agency_vendor_id?: number | null;
  role?: string;
  permissions?: string[];
  shop_id?: number | null;
}

interface AuthState {
  user: User | null;
}

type AuthActions = {
  setUser(user: User): void;
  logout(): void;
};

export const useAuthStore = defineStore<"auth", AuthState, {}, AuthActions>(
  "auth",
  {
  state: (): AuthState => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),
  actions: {
    setUser(user: User) {
      localStorage.setItem("user", JSON.stringify(user));
      this.user = user;

      const token = localStorage.getItem("token");
      if (token) {
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      if (user.vendor_id) {
        axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(
          user.vendor_id
        );
      } else {
        delete axiosInstance.defaults.headers.common["X-Vendor-Id"];
      }
    },
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("vendor_id");
      localStorage.removeItem("user");

      delete axiosInstance.defaults.headers.common["Authorization"];
      delete axiosInstance.defaults.headers.common["X-Vendor-Id"];

      this.user = null;
    },
  },
});


