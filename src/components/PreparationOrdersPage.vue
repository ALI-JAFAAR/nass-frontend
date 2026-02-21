<template>
  <div class="space-y-4" dir="rtl">
    <!-- Header -->
    <div class="rounded-2xl border bg-white/70 backdrop-blur-sm app-panel app-border">
      <div class="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">📦</span>
            <div>
              <h2 class="text-lg font-bold text-gray-900">واجهة التجهيز — طلبات التوصيل (اليوم)</h2>
              <p class="text-xs text-gray-500">
                عرض طلبات اليوم (مودن + توصيل داخلي). التعديل والحذف غير متاحين هنا.
              </p>
            </div>
          </div>
          <p v-if="modonError" class="text-xs text-red-600 pt-1">
            تعذر مزامنة مودن: {{ modonError }}
          </p>
        </div>

        <div class="flex flex-col gap-2 w-full md:w-auto">
          <!-- Search + filters -->
          <div class="flex flex-col md:flex-row gap-2 md:items-center">
            <div class="relative flex-1 min-w-[220px]">
              <input
                v-model="query"
                type="text"
                placeholder="بحث: رقم الطلب / هاتف / اسم العميل / Modon ID"
                class="w-full border rounded-xl px-3 py-2 pr-9 text-sm bg-white app-border focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔎</span>
            </div>

            <select
              v-model="printFilter"
              class="border rounded-xl px-3 py-2 text-sm bg-white app-border"
            >
              <option value="all">الكل</option>
              <option value="unprinted">غير مطبوع</option>
              <option value="printed">مطبوع</option>
            </select>

            <select
              v-model="deliveryFilter"
              class="border rounded-xl px-3 py-2 text-sm bg-white app-border"
            >
              <option value="all">كل طرق التوصيل</option>
              <option value="modon">مودن</option>
              <option value="nass">توصيل داخلي</option>
            </select>

            <button
              v-if="canPrepareOrders"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60 shadow-sm"
              :disabled="loading"
              type="button"
              @click="fetchToday()"
            >
              {{ loading ? "..." : "تحديث" }}
            </button>
          </div>

          <!-- Bulk actions -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="text-xs text-gray-600">
              <span class="font-semibold">{{ visibleOrders.length }}</span> طلب —
              المحدد: <span class="font-semibold">{{ selectedIds.length }}</span>
            </div>

            <button
              v-if="canPrepareOrders"
              class="px-3 py-2 rounded-xl border text-sm bg-white hover:bg-gray-50 disabled:opacity-60 app-border"
              :disabled="loading || !visibleOrders.length"
              type="button"
              @click="toggleAll(true)"
              title="تحديد كل النتائج المعروضة"
            >
              تحديد الكل
            </button>

            <button
              v-if="canPrepareOrders"
              class="px-3 py-2 rounded-xl border text-sm bg-white hover:bg-gray-50 disabled:opacity-60 app-border"
              :disabled="loading || !selectedIds.length"
              type="button"
              @click="toggleAll(false)"
            >
              مسح التحديد
            </button>

            <button
              v-if="canPrepareOrders"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60 shadow-sm"
              :disabled="loading || !selectedIds.length"
              type="button"
              @click="printSelected()"
            >
              طباعة المحدد
            </button>

            <button
              v-if="canPrepareOrders"
              class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm disabled:opacity-60 shadow-sm"
              :disabled="loading || !visibleOrders.length"
              type="button"
              @click="printAll()"
            >
              طباعة الكل
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border bg-white overflow-hidden app-panel app-border">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr class="text-right text-xs text-gray-600">
              <th class="p-3 border-b w-10">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="(e:any) => toggleAll(!!e?.target?.checked)"
                  :disabled="!visibleOrders.length"
                  title="تحديد الكل"
                />
              </th>
              <th class="p-3 border-b">#</th>
              <th class="p-3 border-b">العميل</th>
              <th class="p-3 border-b">الهاتف</th>
              <th class="p-3 border-b">الأصناف</th>
              <th class="p-3 border-b">الإجمالي</th>
              <th class="p-3 border-b">حالة النظام</th>
              <th class="p-3 border-b">طريقة التوصيل</th>
              <th class="p-3 border-b">Modon ID</th>
              <th class="p-3 border-b">حالة مودن</th>
              <th class="p-3 border-b">الطباعة</th>
              <th class="p-3 border-b text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading skeleton -->
            <tr v-if="loading">
              <td colspan="11" class="p-4">
                <div class="space-y-2">
                  <div v-for="i in 3" :key="i" class="h-10 rounded-xl bg-gray-100 animate-pulse"></div>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="!visibleOrders.length">
              <td class="p-8 text-center text-gray-500" colspan="11">
                <div class="inline-flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">🧾</div>
                  <div class="text-sm font-semibold">لا توجد طلبات</div>
                  <div class="text-xs text-gray-500">جرّب تحديث الصفحة أو تغيير الفلتر.</div>
                </div>
              </td>
            </tr>

            <tr
              v-for="o in visibleOrders"
              :key="o.id"
              class="border-b hover:bg-gray-50/70 transition"
            >
              <td class="p-3">
                <input
                  type="checkbox"
                  :checked="selectedSet.has(o.id)"
                  @change="() => toggleOne(o.id)"
                />
              </td>
              <td class="p-3 font-semibold text-gray-900">{{ o.id }}</td>
              <td class="p-3 text-gray-900">
                {{ o.customer?.name ?? o.customer?.username ?? "—" }}
              </td>
              <td class="p-3 text-gray-700">{{ o.customer?.phone ?? "—" }}</td>
              <td class="p-3 text-gray-700">
                {{ Array.isArray(o.items) ? o.items.length : 0 }}
              </td>
              <td class="p-3 font-semibold text-gray-900">
                {{ formatIqD(o.total) }}
              </td>
              <td class="p-3">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-lg text-xs border"
                  :class="o.status === 'shipped'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : (o.status === 'confirmed'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200')"
                >
                  {{ o.status ?? "—" }}
                </span>
              </td>
              <td class="p-3">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-lg text-xs border"
                  :class="(o.delivery_provider || 'modon') === 'nass'
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'"
                >
                  {{ (o.delivery_provider || 'modon') === 'nass' ? 'توصيل داخلي' : 'مودن' }}
                </span>
              </td>
              <td class="p-3 font-mono text-xs text-gray-800">
                {{ (o.delivery_provider || 'modon') === 'modon' ? (o.delivery_external_id ?? "—") : "—" }}
              </td>
              <td class="p-3 text-gray-800">
                <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs border bg-white">
                  {{ (o.delivery_provider || 'modon') === 'modon' ? (o.modon_status ?? "—") : "—" }}
                </span>
              </td>
              <td class="p-3">
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border"
                  :class="o.preparation_printed_at
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'"
                >
                  <span>{{ o.preparation_printed_at ? "✓" : "⏳" }}</span>
                  <span>{{ o.preparation_printed_at ? "مطبوع" : "غير مطبوع" }}</span>
                </span>
              </td>
              <td class="p-3 text-center">
                <button
                  v-if="canPrepareOrders"
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-60 shadow-sm"
                  type="button"
                  :disabled="printingId === o.id"
                  @click="printOne(o.id)"
                >
                  <span>🖨</span>
                  <span>{{ printingId === o.id ? "..." : "طباعة" }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const myPermissions = computed<string[]>(() => {
  const p = auth.user?.permissions;
  return Array.isArray(p) ? (p as string[]) : [];
});
const canPrepareOrders = computed(() => myPermissions.value.includes("prepare orders"));

const orders = ref<any[]>([]);
const loading = ref(false);
const modonError = ref<string>("");
const printingId = ref<number | null>(null);
const selectedSet = ref<Set<number>>(new Set());
const query = ref<string>("");
const printFilter = ref<"all" | "printed" | "unprinted">("all");
const deliveryFilter = ref<"all" | "modon" | "nass">("all");

function formatIqD(value: any): string {
  const n = typeof value === "number" ? value : value ? Number(value) : 0;
  try {
    return `${Math.round(n).toLocaleString("en-US")} IQD`;
  } catch {
    return `${Math.round(n)} IQD`;
  }
}

async function fetchToday() {
  loading.value = true;
  modonError.value = "";
  try {
    const res = await axiosInstance.get("v1/cashier/preparation/orders/today", {
      params: { include_modon: true },
    });
    const data = res.data?.data ?? [];
    orders.value = Array.isArray(data) ? data : [];
    if (res.data?.modon_error) {
      modonError.value = String(res.data.modon_error);
    }
    // Cleanup selected ids that no longer exist
    const ids = new Set<number>(orders.value.map((o: any) => Number(o.id)));
    selectedSet.value = new Set(Array.from(selectedSet.value).filter((id) => ids.has(id)));
  } catch (e: any) {
    modonError.value =
      e?.response?.data?.message ||
      "تعذر تحميل الطلبات (تأكد من الصلاحيات/اختيار المحل).";
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

const selectedIds = ref<number[]>([]);
const allSelected = ref(false);

function syncSelectedComputed() {
  selectedIds.value = Array.from(selectedSet.value);
  const allIds = visibleOrders.value.map((o: any) => Number(o.id));
  allSelected.value = allIds.length > 0 && allIds.every((id) => selectedSet.value.has(id));
}

function toggleOne(orderId: number) {
  const next = new Set(selectedSet.value);
  if (next.has(orderId)) next.delete(orderId);
  else next.add(orderId);
  selectedSet.value = next;
  syncSelectedComputed();
}

function toggleAll(on: boolean) {
  if (!on) {
    selectedSet.value = new Set();
  } else {
    selectedSet.value = new Set(visibleOrders.value.map((o: any) => Number(o.id)));
  }
  syncSelectedComputed();
}

const visibleOrders = computed(() => {
  const q = (query.value || "").trim().toLowerCase();
  const filteredByMethod = orders.value.filter((o: any) => {
    const p = (o?.delivery_provider ?? "").toString().toLowerCase();
    if (deliveryFilter.value === "modon") return p === "modon";
    if (deliveryFilter.value === "nass") return p === "nass";
    return true;
  });

  const filteredByPrint = filteredByMethod.filter((o: any) => {
    const isPrinted = !!o?.preparation_printed_at;
    if (printFilter.value === "printed") return isPrinted;
    if (printFilter.value === "unprinted") return !isPrinted;
    return true;
  });
  if (!q) return filteredByPrint;

  return filteredByPrint.filter((o: any) => {
    const id = String(o?.id ?? "").toLowerCase();
    const modonId = String(o?.delivery_external_id ?? "").toLowerCase();
    const phone = String(o?.customer?.phone ?? "").toLowerCase();
    const name = String(o?.customer?.name ?? o?.customer?.username ?? "").toLowerCase();
    return (
      id.includes(q) ||
      modonId.includes(q) ||
      phone.includes(q) ||
      name.includes(q)
    );
  });
});

async function openAndPrintHtml(fetcher: () => Promise<string>) {
  // Open window first to avoid popup blockers.
  const w = window.open("", "_blank");
  if (!w) {
    alert("يرجى السماح بفتح نافذة جديدة للطباعة.");
    return;
  }

  try {
    const html = await fetcher();
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Give the browser a tick to render before printing.
    setTimeout(() => {
      try {
        w.print();
      } catch {
        // ignore
      }
    }, 250);
  } catch (e: any) {
    w.close();
    alert(
      e?.response?.data?.message || "تعذر تحميل الفاتورة للطباعة."
    );
  }
}

async function printOne(orderId: number) {
  printingId.value = orderId;
  await openAndPrintHtml(async () => {
    const res = await axiosInstance.get(
      `v1/cashier/preparation/orders/${orderId}/print/html`,
      { responseType: "text" as any }
    );
    return typeof res.data === "string" ? res.data : String(res.data ?? "");
  });
  printingId.value = null;
  await fetchToday(); // refresh printed status
}

async function printSelected() {
  if (!selectedIds.value.length) return;
  await openAndPrintHtml(async () => {
    const ids = selectedIds.value.join(",");
    const res = await axiosInstance.get(
      `v1/cashier/preparation/orders/print/html`,
      { params: { ids }, responseType: "text" as any }
    );
    return typeof res.data === "string" ? res.data : String(res.data ?? "");
  });
  await fetchToday();
}

async function printAll() {
  if (!orders.value.length) return;
  toggleAll(true);
  await printSelected();
}

onMounted(fetchToday);
</script>

