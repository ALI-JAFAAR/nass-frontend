<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
  >
    <div class="w-full max-w-sm shadow-lg border border-blue-100 bg-white rounded-lg">
      <div class="p-6 border-b">
        <h2 class="text-center text-blue-700 text-xl font-semibold">
          تسجيل الدخول
        </h2>
      </div>
      <div class="p-6">
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
            <input
              type="text"
              v-model="username"
              required
              autofocus
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              v-model="password"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>
          <button
            type="submit"
            class="w-full py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
          >
            دخول
          </button>
        </form>

        <div class="mt-4 text-center">
          <button
            type="button"
            class="text-sm text-blue-700 hover:text-blue-900 underline"
            @click="router.push({ name: 'signup' })"
          >
            إنشاء حساب جديد
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import { getFcmToken } from "@/firebase";

const router = useRouter();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const error = ref("");

const handleLogin = async () => {
  error.value = "";
  try {
    const res = await axiosInstance.post("v1/login", {
      username: username.value,
      password: password.value,
    });

    localStorage.setItem("token", res.data.token);
    if (res.data.user?.vendor_id) {
      localStorage.setItem("vendor_id", String(res.data.user.vendor_id));
    } else {
      localStorage.removeItem("vendor_id");
    }
    localStorage.setItem("user", JSON.stringify(res.data.user));

    // Mirror original React behavior: set default headers immediately
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    if (res.data.user?.vendor_id) {
      axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(
        res.data.user.vendor_id
      );
    } else {
      delete axiosInstance.defaults.headers.common["X-Vendor-Id"];
    }

    auth.setUser({
      id: res.data.user.id,
      name: res.data.user.name,
      username: res.data.user.username,
      vendor_id: res.data.user.vendor_id,
      vendor_type: res.data.user.vendor_type,
      agency_vendor_id: res.data.user.agency_vendor_id,
      role: res.data.user.role,
      permissions: res.data.user.permissions,
      shop_id: res.data.user.shop_id,
    });

    // Register FCM and send token to backend (desktop push)
    try {
      const token = await getFcmToken();
      if (token) {
        await axiosInstance.post("v1/me/fcm-token", { fcm_token: token });
      }
    } catch (_) {
      // ignore token errors
    }

    router.push({ name: "home" });
  } catch (err: any) {
    error.value = err?.response?.data?.message || "فشل تسجيل الدخول";
  }
};
</script>


