<template>
  <div class="space-y-4" dir="rtl">
    <div class="bg-white rounded-xl border p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 class="text-lg font-extrabold">تسويات الوكالة (التقارير)</h2>
          <p class="text-xs text-gray-500 mt-1">
            يتم احتساب الربح = (سعر البيع - سعر الوكالة) على مستوى الأصناف.
          </p>
        </div>
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          :disabled="loading"
          type="button"
          @click="fetchReport()"
        >
          {{ loading ? "..." : "تحديث" }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label class="block text-[11px] text-gray-500 mb-1">من تاريخ</label>
          <input v-model="from" type="date" class="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-500 mb-1">إلى تاريخ</label>
          <input v-model="to" type="date" class="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-500 mb-1">الحالة</label>
          <select v-model="status" class="w-full border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="delivered">delivered</option>
            <option value="shipped">shipped</option>
            <option value="confirmed">confirmed</option>
            <option value="pending">pending</option>
            <option value="all">all</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            class="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            :disabled="loading"
            type="button"
            @click="fetchReport()"
          >
            {{ loading ? "..." : "عرض التقرير" }}
          </button>
        </div>
      </div>

      <div v-if="error" class="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ error }}
      </div>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <div class="overflow-auto">
        <table class="min-w-[980px] w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-right text-xs text-gray-600">
              <th class="p-3 border-b">البائع</th>
              <th class="p-3 border-b">عدد الطلبات</th>
              <th class="p-3 border-b">عدد القطع</th>
              <th class="p-3 border-b">مجموع البيع</th>
              <th class="p-3 border-b">مجموع سعر الوكالة</th>
              <th class="p-3 border-b">الربح</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="p-6 text-center text-gray-500" colspan="6">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!rows.length">
              <td class="p-6 text-center text-gray-500" colspan="6">لا توجد بيانات.</td>
            </tr>
            <tr v-for="r in rows" :key="r.reseller_vendor_id" class="border-t hover:bg-gray-50">
              <td class="p-3 font-semibold">{{ r.reseller_vendor_name || ("Vendor " + r.reseller_vendor_id) }}</td>
              <td class="p-3 ltr text-left">{{ r.orders_count }}</td>
              <td class="p-3 ltr text-left">{{ r.items_qty }}</td>
              <td class="p-3 ltr text-left font-semibold">{{ fmtMoney(r.sell_total) }}</td>
              <td class="p-3 ltr text-left">{{ fmtMoney(r.base_total) }}</td>
              <td class="p-3 ltr text-left">
                <span :class="profitClass(r.profit_total)">{{ fmtMoney(r.profit_total) }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="rows.length" class="bg-gray-50 border-t">
            <tr class="text-right text-xs text-gray-600">
              <td class="p-3 font-semibold">الإجمالي</td>
              <td class="p-3 ltr text-left font-semibold">{{ totals.orders_count }}</td>
              <td class="p-3 ltr text-left font-semibold">{{ totals.items_qty }}</td>
              <td class="p-3 ltr text-left font-semibold">{{ fmtMoney(totals.sell_total) }}</td>
              <td class="p-3 ltr text-left font-semibold">{{ fmtMoney(totals.base_total) }}</td>
              <td class="p-3 ltr text-left font-semibold">{{ fmtMoney(totals.profit_total) }}</td>
            </tr>
          </tfoot>
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

const loading = ref(false);
const error = ref("");
const rows = ref<any[]>([]);

const from = ref<string>("");
const to = ref<string>("");
const status = ref<string>("delivered");

function fmtMoney(v: any) {
  const n = typeof v === "number" ? v : v ? Number(v) : 0;
  try {
    return new Intl.NumberFormat("ar-IQ").format(Math.round(n)) + " د.ع";
  } catch {
    return String(n) + " د.ع";
  }
}

function profitClass(v: any) {
  const n = typeof v === "number" ? v : v ? Number(v) : 0;
  return n >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold";
}

const totals = computed(() => {
  return rows.value.reduce(
    (acc: any, r: any) => {
      acc.orders_count += Number(r.orders_count ?? 0) || 0;
      acc.items_qty += Number(r.items_qty ?? 0) || 0;
      acc.sell_total += Number(r.sell_total ?? 0) || 0;
      acc.base_total += Number(r.base_total ?? 0) || 0;
      acc.profit_total += Number(r.profit_total ?? 0) || 0;
      return acc;
    },
    { orders_count: 0, items_qty: 0, sell_total: 0, base_total: 0, profit_total: 0 },
  );
});

async function fetchReport() {
  if ((auth.user as any)?.vendor_type !== "agency") {
    error.value = "هذه الصفحة مخصصة لوكالة ناس فقط.";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const params: any = { status: status.value };
    if (from.value) params.from = from.value;
    if (to.value) params.to = to.value;
    const res = await axiosInstance.get("v1/cashier/agency/settlements", { params });
    rows.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل التقرير.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchReport());
</script>

