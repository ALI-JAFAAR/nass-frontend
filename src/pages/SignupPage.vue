<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div class="w-full max-w-md shadow-lg border border-blue-100 bg-white rounded-lg">
      <div class="p-6 border-b">
        <h2 class="text-center text-blue-700 text-xl font-semibold">
          إنشاء حساب متجر
        </h2>
        <p class="text-center text-xs text-gray-500 mt-1">
          اختر نوع الاستخدام ثم أكمل البيانات.
        </p>
      </div>
      <div class="p-6">
        <form class="space-y-4" @submit.prevent="handleSignup">
          <div>
            <label class="block text-sm font-medium mb-1">اسم المسؤول</label>
            <input
              type="text"
              v-model="name"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">اسم المستخدم</label>
            <input
              type="text"
              v-model="username"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">اسم المتجر</label>
            <input
              type="text"
              v-model="vendorName"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div class="rounded-lg border p-3 bg-gray-50">
            <div class="text-sm font-semibold mb-2">نوع الاستخدام</div>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="standard" v-model="mode" />
              <span>عندي منتجاتي (متجر عادي)</span>
            </label>
            <label class="flex items-center gap-2 text-sm mt-2">
              <input
                type="radio"
                value="reseller"
                v-model="mode"
                :disabled="!agencies.length"
              />
              <span :class="!agencies.length ? 'text-gray-400' : ''">
                أبيع منتجات وكالة (مجاني + تسعير فقط)
              </span>
            </label>
            <p class="text-[11px] text-gray-500 mt-2">
              إذا اخترت “وكالة ناس” سيتم خصم المخزون من الوكالة ويتم احتساب الربح من فرق السعر.
            </p>
            <p v-if="!agencies.length" class="text-[11px] text-amber-700 mt-2">
              لا توجد وكالة مفعلة حالياً، لذلك سيتم اعتماد خيار (عندي منتجاتي).
            </p>
          </div>

          <div v-if="mode === 'reseller' && agencies.length > 1" class="rounded-lg border p-3">
            <label class="block text-sm font-medium mb-1">اختر الوكالة</label>
            <select v-model.number="agencyVendorId" class="w-full border rounded px-3 py-2 bg-white text-sm">
              <option :value="0">اختر الوكالة</option>
              <option v-for="a in agencies" :key="a.id" :value="a.id">
                {{ a.name }}
              </option>
            </select>
            <p class="text-[11px] text-gray-500 mt-2">
              سيتم خصم المخزون من الوكالة المختارة.
            </p>
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

          <div>
            <label class="block text-sm font-medium mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              v-model="passwordConfirmation"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <button
            type="submit"
            class="w-full py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-60"
            :disabled="submitting"
          >
            {{ submitting ? "..." : "إنشاء الحساب" }}
          </button>
        </form>

        <div class="mt-4 text-center">
          <button
            type="button"
            class="text-sm text-gray-700 hover:text-gray-900 underline"
            @click="router.push({ name: 'login' })"
          >
            لدي حساب بالفعل
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const username = ref("");
const vendorName = ref("");
const mode = ref<"standard" | "reseller">("standard");
const agencies = ref<Array<{ id: number; name: string }>>([]);
const agencyVendorId = ref<number>(0);
const password = ref("");
const passwordConfirmation = ref("");

const error = ref("");
const submitting = ref(false);

async function loadAgencies() {
  try {
    const res = await axiosInstance.get("v1/agencies");
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    agencies.value = Array.isArray(list) ? list : [];
  } catch {
    agencies.value = [];
  }

  // If no agencies exist, force standard mode.
  if (!agencies.value.length) {
    mode.value = "standard";
    agencyVendorId.value = 0;
    return;
  }

  // If exactly one agency exists, auto-select it.
  if (agencies.value.length === 1) {
    agencyVendorId.value = Number(agencies.value[0]?.id ?? 0) || 0;
  }
}

watch(
  () => mode.value,
  () => {
    if (mode.value !== "reseller") {
      agencyVendorId.value = 0;
    } else {
      if (agencies.value.length === 1) {
        agencyVendorId.value = Number(agencies.value[0]?.id ?? 0) || 0;
      }
    }
  },
);

async function handleSignup() {
  error.value = "";
  submitting.value = true;
  try {
    const res = await axiosInstance.post("v1/vendor/signup", {
      name: name.value,
      username: username.value,
      vendor_name: vendorName.value,
      mode: mode.value,
      agency_vendor_id: mode.value === "reseller" ? (agencyVendorId.value || null) : null,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    localStorage.setItem("token", res.data.token);
    if (res.data.user?.vendor_id) {
      localStorage.setItem("vendor_id", String(res.data.user.vendor_id));
    } else {
      localStorage.removeItem("vendor_id");
    }
    localStorage.setItem("user", JSON.stringify(res.data.user));

    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    if (res.data.user?.vendor_id) {
      axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(res.data.user.vendor_id);
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

    router.push({ name: "home" });
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر إنشاء الحساب";
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadAgencies();
});
</script>

