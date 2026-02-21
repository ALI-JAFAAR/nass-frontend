<template>
  <div class="space-y-4" dir="rtl">
    <div class="bg-white rounded-xl border p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 class="text-lg font-extrabold">طلبات الوكالة</h2>
          <p class="text-xs text-gray-500 mt-1">
            هذه الصفحة تعرض طلبات “وكالة ناس” الخاصة بنظام الوكالة.
          </p>
        </div>
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          :disabled="loading"
          type="button"
          @click="fetchOrders()"
        >
          {{ loading ? "..." : "تحديث" }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          v-model="q"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="🔍 بحث بالاسم أو الهاتف..."
          @input="debouncedFetch"
        />
        <select v-model="status" class="w-full border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">كل الحالات</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
          <option value="suspended">suspended</option>
        </select>
        <div class="text-xs text-gray-500 flex items-center justify-between">
          <span>الإجمالي: <span class="font-semibold">{{ total }}</span></span>
          <span>الصفحة: <span class="font-semibold">{{ page }}</span> / {{ lastPage }}</span>
        </div>
      </div>

      <div v-if="error" class="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ error }}
      </div>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <div class="overflow-auto">
        <table class="min-w-[1050px] w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-right text-xs text-gray-600">
              <th class="p-3 border-b">رقم الطلب</th>
              <th class="p-3 border-b">الزبون</th>
              <th class="p-3 border-b">الهاتف</th>
              <th class="p-3 border-b">الإجمالي</th>
              <th class="p-3 border-b">الحالة</th>
              <th class="p-3 border-b">التاريخ</th>
              <th class="p-3 border-b text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="p-6 text-center text-gray-500" colspan="7">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td class="p-6 text-center text-gray-500" colspan="7">لا توجد طلبات.</td>
            </tr>
            <tr v-for="o in items" :key="o.id" class="border-t hover:bg-gray-50">
              <td class="p-3 font-semibold">{{ o.id }}</td>
              <td class="p-3">{{ o.customer?.name ?? o.customer?.username ?? "—" }}</td>
              <td class="p-3 ltr text-left whitespace-nowrap">{{ o.customer?.phone ?? "—" }}</td>
              <td class="p-3 ltr text-left whitespace-nowrap">{{ fmtMoney(o.total ?? 0) }}</td>
              <td class="p-3">
                <span class="px-2 py-1 rounded-full border text-xs">
                  {{ o.status }}
                </span>
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap">
                {{ (o.created_at ?? "").slice(0, 19).replace("T", " ") }}
              </td>
              <td class="p-3 text-center">
                <button
                  class="px-3 py-2 rounded-lg border text-xs hover:bg-gray-50"
                  type="button"
                  @click="openOrder(o.id)"
                >
                  فتح
                </button>
                <button
                  class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 mr-2"
                  type="button"
                  @click="printOrder(o.id)"
                >
                  طباعة
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4 border-t flex items-center justify-between text-xs text-gray-600">
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60" :disabled="page <= 1 || loading" type="button" @click="go(page - 1)">
            السابق
          </button>
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60" :disabled="page >= lastPage || loading" type="button" @click="go(page + 1)">
            التالي
          </button>
        </div>
        <div class="text-[11px] text-gray-500">
          لتغيير الحالة استخدم شاشة “طلبات المتجر” أو زر فتح ثم تعديل الحالة من هناك.
        </div>
      </div>
    </div>

    <!-- Simple modal showing order JSON in readable way (minimal risk) -->
    <div
      v-if="modalOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6" dir="rtl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">تفاصيل الطلب</h3>
            <p class="text-xs text-gray-500 mt-1">
              يمكنك طباعة الفاتورة من زر الطباعة.
            </p>
          </div>
          <button class="text-gray-400 hover:text-gray-700 text-xl" type="button" @click="closeModal">×</button>
        </div>

        <div v-if="modalLoading" class="mt-6 text-center text-gray-500">جاري التحميل...</div>
        <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-xl border p-4 bg-gray-50">
            <div class="text-xs text-gray-500">رقم الطلب</div>
            <div class="text-lg font-extrabold mt-1">{{ selected?.id ?? "—" }}</div>
            <div class="text-xs text-gray-500 mt-3">الحالة</div>
            <div class="font-semibold mt-1">{{ selected?.status ?? "—" }}</div>
            <div class="text-xs text-gray-500 mt-3">الإجمالي</div>
            <div class="font-semibold mt-1">{{ fmtMoney(selected?.total ?? 0) }}</div>
          </div>
          <div class="rounded-xl border p-4">
            <div class="text-xs text-gray-500">الزبون</div>
            <div class="font-semibold mt-1">{{ selected?.customer?.name ?? "—" }}</div>
            <div class="text-xs text-gray-500 mt-3">الهاتف</div>
            <div class="font-semibold mt-1 ltr text-left">{{ selected?.customer?.phone ?? "—" }}</div>
            <div class="text-xs text-gray-500 mt-3">العنوان</div>
            <div class="font-semibold mt-1">{{ selected?.address_text ?? "—" }}</div>
          </div>
        </div>

        <div v-if="selected?.items?.length" class="mt-6 rounded-xl border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="text-right text-xs text-gray-600">
                <th class="p-3 border-b">المنتج</th>
                <th class="p-3 border-b">الكمية</th>
                <th class="p-3 border-b">السعر</th>
                <th class="p-3 border-b">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in selected.items" :key="idx" class="border-t">
                <td class="p-3">{{ it.product?.name ?? it.meta?.name ?? "—" }}</td>
                <td class="p-3 ltr text-left">{{ it.quantity }}</td>
                <td class="p-3 ltr text-left">{{ fmtMoney(it.unit_price ?? 0) }}</td>
                <td class="p-3 ltr text-left">{{ fmtMoney(it.line_total ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex items-center justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border" type="button" @click="closeModal">إغلاق</button>
          <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white" type="button" @click="printOrder(selected?.id)">
            طباعة
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const loading = ref(false);
const error = ref("");
const q = ref("");
const status = ref("");

const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const lastPage = ref(1);

function fmtMoney(v: any) {
  const n = typeof v === "number" ? v : v ? Number(v) : 0;
  try {
    return new Intl.NumberFormat("ar-IQ").format(Math.round(n)) + " د.ع";
  } catch {
    return String(n) + " د.ع";
  }
}

let t: any = null;
function debouncedFetch() {
  clearTimeout(t);
  t = setTimeout(() => go(1), 250);
}

async function fetchOrders(p = 1) {
  if ((auth.user as any)?.vendor_type !== "reseller") {
    error.value = "هذه الصفحة مخصصة للبائعين بنظام الوكالة.";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const params: any = { page: p, per_page: 15 };
    if (status.value) params.status = status.value;
    if (q.value.trim()) {
      // backend doesn't implement q yet; we fallback to client-side filter by showing all.
      // keep param for future compatibility
      params.customer_name = q.value.trim();
    }
    const res = await axiosInstance.get("v1/cashier/agency/orders", { params });
    items.value = Array.isArray(res.data?.data) ? res.data.data : [];
    page.value = Number(res.data?.current_page ?? p) || p;
    lastPage.value = Number(res.data?.last_page ?? 1) || 1;
    total.value = Number(res.data?.total ?? 0) || 0;
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل الطلبات.";
  } finally {
    loading.value = false;
  }
}

function go(p: number) {
  fetchOrders(p);
}

function printOrder(id: any) {
  if (!id) return;
  // Reuse preparation print document (unified) for consistent output
  const url = axiosInstance.defaults.baseURL
    ? `${axiosInstance.defaults.baseURL}v1/cashier/preparation/orders/${id}/print/html`
    : `v1/cashier/preparation/orders/${id}/print/html`;
  window.open(url, "_blank");
}

// Modal details
const modalOpen = ref(false);
const modalLoading = ref(false);
const selected = ref<any | null>(null);

async function openOrder(id: number) {
  modalOpen.value = true;
  modalLoading.value = true;
  selected.value = null;
  try {
    const res = await axiosInstance.get(`v1/cashier/orders/${id}`);
    selected.value = res.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل تفاصيل الطلب.";
    modalOpen.value = false;
  } finally {
    modalLoading.value = false;
  }
}

function closeModal() {
  modalOpen.value = false;
  selected.value = null;
}

onMounted(() => fetchOrders(1));
</script>

