<template>
  <div class="space-y-4" dir="rtl">
    <div class="bg-white rounded-xl border p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 class="text-lg font-extrabold">تسعير منتجات الوكالة</h2>
          <p class="text-xs text-gray-500 mt-1">
            يمكنك تعديل سعر البيع فقط. المخزون يُخصم من الوكالة، والربح يحسب من فرق السعر.
          </p>
        </div>
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          :disabled="loading"
          type="button"
          @click="fetchPage(1)"
        >
          {{ loading ? "..." : "تحديث" }}
        </button>
      </div>

      <div class="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
        <input
          v-model="q"
          class="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm"
          placeholder="🔍 بحث باسم المنتج أو SKU..."
          @input="debouncedFetch"
        />
        <div class="text-xs text-gray-500">
          إجمالي النتائج: <span class="font-semibold">{{ total }}</span>
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
              <th class="p-3 border-b">المنتج</th>
              <th class="p-3 border-b">SKU</th>
              <th class="p-3 border-b">المخزون</th>
              <th class="p-3 border-b">سعر الوكالة</th>
              <th class="p-3 border-b">سعر البيع</th>
              <th class="p-3 border-b">الربح/قطعة</th>
              <th class="p-3 border-b text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="p-6 text-center text-gray-500" colspan="7">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td class="p-6 text-center text-gray-500" colspan="7">لا توجد نتائج.</td>
            </tr>
            <tr v-for="it in items" :key="it.variant_id" class="border-t hover:bg-gray-50">
              <td class="p-3">
                <div class="font-semibold">{{ it.product_name }}</div>
                <div class="text-[11px] text-gray-500">{{ it.color || "—" }} / {{ it.size || "—" }}</div>
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap">
                {{ it.variant_sku || it.product_sku || "—" }}
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap">
                {{ it.stock ?? 0 }}
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap font-semibold">
                {{ fmtMoney(it.base_price) }}
              </td>
              <td class="p-3">
                <input
                  v-model.number="draftPrices[it.variant_id]"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-40 border rounded-lg px-3 py-2 text-sm ltr text-left"
                  :placeholder="String(it.sell_price)"
                />
                <div class="text-[11px] text-gray-500 mt-1">
                  الحالي: <span class="font-semibold">{{ fmtMoney(it.sell_price) }}</span>
                  <span v-if="it.has_override" class="mr-2">(مخصص)</span>
                </div>
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap">
                <span :class="profitClass(it.profit_per_unit)">
                  {{ fmtMoney(it.profit_per_unit) }}
                </span>
              </td>
              <td class="p-3 text-center">
                <button
                  class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-60"
                  :disabled="savingId === it.variant_id"
                  type="button"
                  @click="savePrice(it)"
                >
                  {{ savingId === it.variant_id ? "..." : "حفظ" }}
                </button>
                <button
                  class="px-3 py-2 rounded-lg border text-xs hover:bg-gray-50 mr-2 disabled:opacity-60"
                  :disabled="savingId === it.variant_id || !it.has_override"
                  type="button"
                  @click="removeOverride(it)"
                >
                  حذف التخصيص
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4 border-t flex items-center justify-between text-xs text-gray-600">
        <div>
          الصفحة: <span class="font-semibold">{{ page }}</span> / {{ lastPage }}
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60" :disabled="page <= 1 || loading" type="button" @click="fetchPage(page - 1)">
            السابق
          </button>
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60" :disabled="page >= lastPage || loading" type="button" @click="fetchPage(page + 1)">
            التالي
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

const items = ref<any[]>([]);
const page = ref(1);
const lastPage = ref(1);
const total = ref(0);

const draftPrices = ref<Record<number, number | null>>({});
const savingId = ref<number | null>(null);

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

let t: any = null;
function debouncedFetch() {
  clearTimeout(t);
  t = setTimeout(() => fetchPage(1), 250);
}

async function fetchPage(p: number) {
  // hard guard: only reseller vendors should use this UI
  if ((auth.user as any)?.vendor_type !== "reseller") {
    error.value = "هذه الصفحة مخصصة للبائعين بنظام الوكالة فقط.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const res = await axiosInstance.get("v1/cashier/agency/catalog", {
      params: { q: q.value || undefined, page: p, per_page: 25 },
    });
    items.value = Array.isArray(res.data?.data) ? res.data.data : [];
    page.value = Number(res.data?.current_page ?? p) || p;
    lastPage.value = Number(res.data?.last_page ?? 1) || 1;
    total.value = Number(res.data?.total ?? 0) || 0;

    // init draft values empty (let placeholder show current)
    const next: Record<number, number | null> = { ...draftPrices.value };
    for (const it of items.value) {
      const id = Number(it?.variant_id ?? 0);
      if (id && !(id in next)) next[id] = null;
    }
    draftPrices.value = next;
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل الكتالوج.";
  } finally {
    loading.value = false;
  }
}

async function savePrice(it: any) {
  const id = Number(it?.variant_id ?? 0);
  if (!id) return;
  const val = draftPrices.value[id];
  const sell = typeof val === "number" ? val : Number(it?.sell_price ?? 0);
  if (!Number.isFinite(sell) || sell < 0) return;

  savingId.value = id;
  try {
    await axiosInstance.post("v1/cashier/agency/prices", {
      variant_id: id,
      sell_price: sell,
    });
    await fetchPage(page.value);
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر حفظ السعر.";
  } finally {
    savingId.value = null;
  }
}

async function removeOverride(it: any) {
  const id = Number(it?.variant_id ?? 0);
  if (!id) return;
  savingId.value = id;
  try {
    await axiosInstance.post("v1/cashier/agency/prices", {
      variant_id: id,
      sell_price: null,
    });
    draftPrices.value[id] = null;
    await fetchPage(page.value);
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر حذف التخصيص.";
  } finally {
    savingId.value = null;
  }
}

onMounted(() => {
  fetchPage(1);
});
</script>

