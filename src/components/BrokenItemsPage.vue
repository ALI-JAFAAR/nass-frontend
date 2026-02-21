<template>
  <div class="space-y-4">
    <div class="rounded-2xl border bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-extrabold">الأجهزة التالفة (الصيانة)</h2>
          <p class="text-xs text-gray-500">
            تسجيل الأجهزة المرسلة للصيانة ومتابعة الإرجاع للمخزون (يدعم الإرجاع الجزئي).
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="query"
            class="border rounded-lg px-3 py-2 text-sm"
            placeholder="بحث بالاسم أو SKU..."
          />
          <select v-model="statusFilter" class="border rounded-lg px-3 py-2 text-sm">
            <option value="open">المفتوحة</option>
            <option value="closed">المغلقة</option>
            <option value="all">الكل</option>
          </select>
          <button
            class="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            type="button"
            :disabled="loading"
            @click="fetchBrokenItems"
          >
            تحديث
          </button>
        </div>
      </div>
    </div>

    <!-- Add broken item (vendor/catalog users) -->
    <div v-if="canAdd" class="rounded-2xl border bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <h3 class="font-bold">إضافة جهاز تالف للصيانة</h3>
        <p class="text-[11px] text-gray-500">اختيار المنتج قابل للبحث</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div class="md:col-span-2 space-y-2">
          <label class="text-sm font-semibold">المنتج</label>
          <div class="relative">
            <input
              v-model="productSearch"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="اختر منتج (يمكن البحث)..."
              @input="debouncedSearchProducts"
              @focus="openProductPicker"
              @keydown.esc.prevent="closeProductPicker"
            />
            <div
              v-if="showProductDropdown"
              class="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto"
            >
              <button
                v-for="p in productResults"
                :key="p.id"
                type="button"
                class="w-full text-right px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                @click="selectProduct(p)"
              >
                <div class="font-semibold">{{ p.name }}</div>
                <div class="text-xs text-gray-500 ltr">{{ p.sku || "—" }}</div>
              </button>
              <div v-if="productLoading" class="p-3 text-sm text-gray-500">
                جاري التحميل...
              </div>
              <button
                v-if="productHasMore && !productLoading"
                type="button"
                class="w-full text-center px-3 py-2 hover:bg-gray-50 text-sm text-blue-700"
                @click="loadMoreProducts"
              >
                تحميل المزيد
              </button>
              <div v-if="!productResults.length" class="p-3 text-sm text-gray-500">
                لا توجد نتائج.
              </div>
            </div>
          </div>

          <div v-if="selectedProduct" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-semibold">الموديل / Variant</label>
              <select v-model.number="selectedVariantId" class="w-full border rounded-lg px-3 py-2 text-sm">
                <option :value="0">افتراضي</option>
                <option v-for="v in selectedProduct.variants || []" :key="v.id" :value="v.id">
                  {{ v.sku || ("VAR " + v.id) }} — مخزون: {{ v.stock ?? 0 }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-semibold">الكمية التالفة</label>
              <input
                v-model.number="brokenQty"
                type="number"
                min="1"
                class="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="مثال: 3"
              />
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold">ملاحظات (اختياري)</label>
          <textarea
            v-model="notes"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            rows="5"
            placeholder="مثال: شاشة مكسورة / بطارية..."
          />
          <button
            class="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            type="button"
            :disabled="submitting || !selectedProduct || !brokenQty || brokenQty <= 0"
            @click="createBrokenItem"
          >
            {{ submitting ? "جاري..." : "إضافة" }}
          </button>
          <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div v-if="error" class="p-4 text-sm text-red-600">{{ error }}</div>
      <div v-else-if="loading" class="p-6 text-center text-gray-500">جاري التحميل...</div>
      <div v-else>
        <table class="w-full text-sm table-fixed">
          <thead class="bg-gray-50">
            <tr class="text-right">
              <th class="p-3 border-b w-[28%]">المنتج</th>
              <th class="p-3 border-b w-[22%]">Variant</th>
              <th class="p-3 border-b w-[8%]">التالف</th>
              <th class="p-3 border-b w-[8%]">المُرجع</th>
              <th class="p-3 border-b w-[8%]">المتبقي</th>
              <th class="p-3 border-b w-[12%]">الحالة</th>
              <th class="p-3 border-b w-[14%] text-center">إرجاع للمخزون</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td class="p-6 text-center text-gray-500" colspan="7">لا توجد بيانات.</td>
            </tr>
            <tr v-for="it in items" :key="it.id" class="border-b align-top">
              <td class="p-3 text-right">
                <div class="font-semibold truncate">{{ it.product?.name ?? "—" }}</div>
                <div class="text-xs text-gray-500 ltr truncate">{{ it.product?.sku ?? "—" }}</div>
              </td>
              <td class="p-3 ltr text-left whitespace-nowrap truncate">{{ it.variant?.sku ?? "—" }}</td>
              <td class="p-3 ltr text-left whitespace-nowrap">{{ it.broken_quantity }}</td>
              <td class="p-3 ltr text-left whitespace-nowrap">{{ it.returned_quantity }}</td>
              <td class="p-3 ltr text-left whitespace-nowrap font-semibold">{{ it.remaining_quantity ?? 0 }}</td>
              <td class="p-3 text-right">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-lg text-xs border"
                  :class="
                    it.status === 'closed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : it.status === 'partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                  "
                >
                  {{ it.status }}
                </span>
              </td>
              <td class="p-3 text-center">
                <button
                  v-if="canReturn"
                  class="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs"
                  type="button"
                  :disabled="returningId === it.id || (it.remaining_quantity ?? 0) <= 0"
                  @click="openReturnDialog(it)"
                >
                  إرجاع
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Return dialog -->
    <div
      v-if="returnDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeReturnDialog"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" dir="rtl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">إرجاع للمخزون</h3>
          <button class="text-gray-400 hover:text-gray-700 text-xl" type="button" @click="closeReturnDialog">×</button>
        </div>

        <p class="text-sm text-gray-600">
          المتبقي: <span class="font-bold ltr">{{ currentRemaining }}</span>
        </p>

        <div class="mt-3 space-y-2">
          <label class="text-sm font-semibold">الكمية المُرجعة</label>
          <input
            v-model.number="returnQty"
            type="number"
            min="1"
            :max="currentRemaining"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="اتركها فارغة لإرجاع الكل"
          />
          <p class="text-[11px] text-gray-500">
            إذا لم تدخل رقمًا سيتم إرجاع كل الكمية المتبقية.
          </p>
        </div>

        <div class="flex gap-2 mt-5">
          <button
            v-if="canReturn"
            class="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            type="button"
            :disabled="returningId === currentItem?.id"
            @click="submitReturn"
          >
            {{ returningId === currentItem?.id ? "جاري..." : "تأكيد الإرجاع" }}
          </button>
          <button class="px-4 py-2 rounded-lg border" type="button" @click="closeReturnDialog">إلغاء</button>
        </div>
        <p v-if="returnError" class="text-xs text-red-600 mt-2">{{ returnError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const perms = computed(() => auth.user?.permissions || []);
const canAdd = computed(
  () =>
    perms.value.includes("تعريف المنتجات") ||
    perms.value.includes("manage catalog"),
);

const canReturn = computed(
  () =>
    perms.value.includes("prepare orders") ||
    perms.value.includes("prepare maintenance") ||
    perms.value.includes("manage maintenance"),
);

const loading = ref(false);
const error = ref("");
const items = ref<any[]>([]);
const query = ref("");
const statusFilter = ref<"open" | "closed" | "all">("open");

async function fetchBrokenItems() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axiosInstance.get("v1/cashier/broken-items", {
      params: { q: query.value || undefined, status: statusFilter.value },
    });
    items.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل البيانات.";
  } finally {
    loading.value = false;
  }
}

// Add form
const submitting = ref(false);
const formError = ref("");
const productSearch = ref("");
const productResults = ref<any[]>([]);
const selectedProduct = ref<any | null>(null);
const selectedVariantId = ref<number>(0);
const brokenQty = ref<number | null>(null);
const notes = ref("");

const showProductDropdown = computed(() => {
  return productPickerOpen.value && !selectedProduct.value;
});

const productPickerOpen = ref(false);
const productLoading = ref(false);
const productHasMore = ref(false);
const productPage = ref(1);

let searchTimer: any = null;
function debouncedSearchProducts() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchProducts(true), 250);
}

function openProductPicker() {
  productPickerOpen.value = true;
  // Load first page even if query is empty (show products list).
  fetchProducts(true);
}

function closeProductPicker() {
  productPickerOpen.value = false;
}

async function fetchProducts(reset: boolean) {
  const q = productSearch.value.trim();
  if (reset) {
    productPage.value = 1;
    productResults.value = [];
    productHasMore.value = false;
  }
  // If picker isn't open, don't fetch.
  if (!productPickerOpen.value) return;
  productLoading.value = true;
  try {
    const res = await axiosInstance.get("v1/cashier/broken-items/products/search", {
      params: { q, page: productPage.value, limit: 50 },
    });
    const data = Array.isArray(res.data?.data) ? res.data.data : [];
    const meta = res.data?.meta || {};
    productHasMore.value = !!meta?.has_more;
    productResults.value = reset ? data : [...productResults.value, ...data];
  } catch {
    productResults.value = reset ? [] : productResults.value;
    productHasMore.value = false;
  } finally {
    productLoading.value = false;
  }
}

async function loadMoreProducts() {
  if (productLoading.value || !productHasMore.value) return;
  productPage.value += 1;
  await fetchProducts(false);
}

function selectProduct(p: any) {
  selectedProduct.value = p;
  productSearch.value = `${p.name}`;
  selectedVariantId.value = 0;
  productResults.value = [];
  productPickerOpen.value = false;
}

async function createBrokenItem() {
  if (!selectedProduct.value) return;
  submitting.value = true;
  formError.value = "";
  try {
    await axiosInstance.post("v1/cashier/broken-items", {
      product_id: selectedProduct.value.id,
      variant_id: selectedVariantId.value > 0 ? selectedVariantId.value : null,
      quantity: brokenQty.value,
      notes: notes.value || null,
    });
    selectedProduct.value = null;
    productSearch.value = "";
    selectedVariantId.value = 0;
    brokenQty.value = null;
    notes.value = "";
    await fetchBrokenItems();
  } catch (e: any) {
    formError.value = e?.response?.data?.message || "تعذر الإضافة.";
  } finally {
    submitting.value = false;
  }
}

// Return dialog
const returnDialogOpen = ref(false);
const currentItem = ref<any | null>(null);
const returnQty = ref<number | null>(null);
const returningId = ref<number | null>(null);
const returnError = ref("");

const currentRemaining = computed(() => {
  const r = Number(currentItem.value?.remaining_quantity ?? 0);
  return Number.isFinite(r) ? r : 0;
});

function openReturnDialog(it: any) {
  currentItem.value = it;
  returnQty.value = null;
  returnError.value = "";
  returnDialogOpen.value = true;
}

function closeReturnDialog() {
  returnDialogOpen.value = false;
  currentItem.value = null;
  returnQty.value = null;
  returnError.value = "";
}

async function submitReturn() {
  if (!currentItem.value?.id) return;
  returningId.value = currentItem.value.id;
  returnError.value = "";
  try {
    await axiosInstance.post(`v1/cashier/broken-items/${currentItem.value.id}/return`, {
      quantity: typeof returnQty.value === "number" && returnQty.value > 0 ? returnQty.value : null,
    });
    closeReturnDialog();
    await fetchBrokenItems();
  } catch (e: any) {
    returnError.value = e?.response?.data?.message || "تعذر الإرجاع.";
  } finally {
    returningId.value = null;
  }
}

onMounted(fetchBrokenItems);
</script>

<style scoped>
.ltr {
  direction: ltr;
  text-align: left;
}
</style>

