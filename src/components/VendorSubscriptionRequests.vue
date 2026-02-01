<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center border-b">
        <h2 class="text-blue-800 font-semibold">طلبات الاشتراك</h2>
        <button
          class="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          @click="openDialogForNew"
        >
          طلب جديد
        </button>
      </div>
      <div class="p-4">
        <div class="flex gap-2 mb-4">
          <input
            v-model="searchTerm"
            placeholder="🔍 ابحث بالمحل أو الحالة..."
            class="flex-1 border rounded px-3 py-2"
          />
          <select
            v-model="statusFilter"
            class="border rounded px-3 py-2 text-sm"
          >
            <option value="">كل الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">موافق عليه</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border-b px-2 py-1 text-right">#</th>
              <th class="border-b px-2 py-1 text-right">المحل</th>
              <th class="border-b px-2 py-1 text-right">الخطة</th>
              <th class="border-b px-2 py-1 text-right">الحالة</th>
              <th class="border-b px-2 py-1 text-right">تاريخ الطلب</th>
              <th class="border-b px-2 py-1 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filteredRequests" :key="r.id">
              <td class="border-b px-2 py-1">
                {{ (page - 1) * perPage + i + 1 }}
              </td>
              <td class="border-b px-2 py-1">
                {{ r.vendor?.name ?? "-" }}
              </td>
              <td class="border-b px-2 py-1">
                {{ r.plan?.name ?? "-" }}
              </td>
              <td class="border-b px-2 py-1">
                <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="statusBadgeClass(r.status)"
                >
                  {{ statusLabel(r.status) }}
                </span>
              </td>
              <td class="border-b px-2 py-1">
                {{ formatDate(r.created_at) }}
              </td>
              <td class="border-b px-2 py-1">
                <button
                  class="px-3 py-1 border rounded text-xs"
                  @click="openDialogForEdit(r)"
                >
                  تعديل
                </button>
                <button
                  class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
                  @click="handleDelete(r.id)"
                >
                  حذف
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-end gap-2 mt-4">
          <button
            v-for="pageNum in totalPages"
            :key="pageNum"
            class="px-3 py-1 rounded border text-sm"
            :class="page === pageNum ? 'bg-blue-600 text-white' : ''"
            @click="changePage(pageNum)"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isDialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingRequest ? "تعديل الطلب" : "إضافة طلب" }}
        </h3>
        <form class="space-y-3" @submit.prevent="handleSubmit">
          <div v-if="isSuperAdmin">
            <label class="block mb-1 text-sm">المحل *</label>
            <select
              v-model.number="formData.vendor_id"
              required
              class="w-full border rounded px-3 py-2"
            >
              <option v-for="v in vendors" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-1 text-sm">الخطة *</label>
            <select
              v-model.number="formData.plan_id"
              required
              class="w-full border rounded px-3 py-2"
            >
              <option v-for="p in plans" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.duration_days }} يوم)
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-1 text-sm">ملاحظات</label>
            <textarea
              v-model="formData.note"
              class="w-full border rounded px-3 py-2"
              rows="3"
            />
          </div>

          <div v-if="isSuperAdmin">
            <label class="block mb-1 text-sm">الحالة</label>
            <select
              v-model="formData.status"
              class="w-full border rounded px-3 py-2"
            >
              <option value="pending">قيد المراجعة</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
            >
              {{ editingRequest ? "تحديث" : "إضافة" }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded border"
              @click="isDialogOpen = false"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

interface Vendor {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  name: string;
  duration_days: number;
}

interface Request {
  id: number;
  vendor_id: number;
  plan_id: number;
  status: "pending" | "approved" | "rejected";
  note?: string | null;
  created_at?: string;
  vendor?: Vendor;
  plan?: Plan;
}

const auth = useAuthStore();
const isSuperAdmin = computed(() => !auth.user?.vendor_id);

const requests = ref<Request[]>([]);
const page = ref(1);
const perPage = ref(20);
const totalPages = ref(1);

const vendors = ref<Vendor[]>([]);
const plans = ref<Plan[]>([]);

const searchTerm = ref("");
const statusFilter = ref<string>("");
const isDialogOpen = ref(false);
const editingRequest = ref<Request | null>(null);
const formData = ref<{
  vendor_id: number | null;
  plan_id: number | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
}>({
  vendor_id: null,
  plan_id: null,
  status: "pending",
  note: null,
});

onMounted(() => {
  fetchInitialData();
});

async function fetchInitialData() {
  await Promise.all([fetchPlans(), fetchVendors(), fetchRequests()]);
}

async function fetchRequests() {
  const res = await axiosInstance.get("v1/admin/vendor-subscription-requests", {
    params: { page: page.value, status: statusFilter.value || undefined },
  });
  const data = res.data;
  const list = Array.isArray(data) ? data : data.data;
  requests.value = Array.isArray(list) ? list : [];
  if (!Array.isArray(data)) {
    const lastPage = data?.last_page ?? 1;
    totalPages.value = lastPage;
    perPage.value = data?.per_page ?? 20;
  }
}

async function fetchPlans() {
  const res = await axiosInstance.get("v1/admin/subscription-plans", {
    params: { page: 1 },
  });
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  plans.value = Array.isArray(list) ? list : [];
}

async function fetchVendors() {
  if (!isSuperAdmin.value) {
    // vendor users only need their own vendor, already implied by API
    vendors.value = [];
    return;
  }
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  vendors.value = Array.isArray(list) ? list : [];
}

async function handleSubmit() {
  try {
    const payload = {
      ...formData.value,
      vendor_id: formData.value.vendor_id,
      plan_id: formData.value.plan_id,
    };

    if (!payload.plan_id) {
      alert("يجب اختيار الخطة");
      return;
    }

    if (editingRequest.value) {
      await axiosInstance.put(
        `v1/admin/vendor-subscription-requests/${editingRequest.value.id}`,
        isSuperAdmin.value
          ? payload
          : { note: payload.note, status: "pending" },
      );
    } else {
      // vendor_id is determined by backend for vendor users; admin must choose it
      await axiosInstance.post(
        "v1/admin/vendor-subscription-requests",
        payload,
      );
    }

    isDialogOpen.value = false;
    resetForm();
    fetchRequests();
  } catch {
    alert("حدث خطأ أثناء حفظ الطلب");
  }
}

async function handleDelete(id: number) {
  if (!confirm("هل تريد حذف هذا الطلب؟")) return;
  await axiosInstance.delete(`v1/admin/vendor-subscription-requests/${id}`);
  fetchRequests();
}

function resetForm() {
  editingRequest.value = null;
  formData.value = {
    vendor_id: auth.user?.vendor_id ?? null,
    plan_id: null,
    status: "pending",
    note: null,
  };
}

const filteredRequests = computed(() =>
  requests.value.filter((r) => {
    const text = `${r.vendor?.name ?? ""} ${statusLabel(r.status)}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.value.toLowerCase());
    const matchesStatus =
      !statusFilter.value || r.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  }),
);

function openDialogForNew() {
  resetForm();
  isDialogOpen.value = true;
}

function openDialogForEdit(r: Request) {
  editingRequest.value = r;
  formData.value = {
    vendor_id: r.vendor_id,
    plan_id: r.plan_id,
    status: r.status,
    note: r.note ?? null,
  };
  isDialogOpen.value = true;
}

function statusLabel(status: string): string {
  switch (status) {
    case "approved":
      return "موافق عليه";
    case "rejected":
      return "مرفوض";
    default:
      return "قيد المراجعة";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function formatDate(value?: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString("ar-EG");
}

function changePage(pageNum: number) {
  page.value = pageNum;
  fetchRequests();
}
</script>


