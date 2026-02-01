<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
      <div class="px-4 py-3">
        <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
          فواتير المبيعات
        </h2>
        <p class="text-sm text-gray-600">
          إجمالي الفواتير: {{ total }} فاتورة
        </p>
      </div>
    </div>

    <!-- Invoices List -->
    <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
      <div class="px-4 py-3 border-b">
        <div
          class="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <h3 class="flex items-center gap-2 text-blue-800 font-semibold">
            قائمة الفواتير ({{ total }})
          </h3>
          <div class="flex flex-col md:flex-row gap-2 md:items-end">
            <div>
              <label class="block text-xs text-gray-600 mb-1">من تاريخ</label>
              <input
                v-model="dateFrom"
                type="date"
                class="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
              <input
                v-model="dateTo"
                type="date"
                class="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1"
                >عدد العناصر في الصفحة</label
              >
              <select
                v-model.number="pageSize"
                @change="onPageSizeChange"
                class="border rounded px-2 py-1 text-sm"
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <button
              class="px-4 py-2 rounded bg-blue-600 text-white text-sm mt-2 md:mt-0"
              @click="applyFilter"
            >
              تطبيق الفلتر
            </button>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div
          v-if="sales.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <p>لا توجد فواتير مبيعات بعد</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="invoice in sales"
            :key="invoice.id"
            class="border border-blue-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
            @click="openInvoiceDialog(invoice)"
          >
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-block px-2 py-0.5 rounded-full border text-xs text-blue-600 border-blue-300"
                    >
                      {{ invoice.invoice_number }}
                    </span>
                    <span class="text-sm text-gray-600">
                      {{ invoice.items.length }} منتج
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div class="flex items-center gap-1">
                      <span>{{ fmtDate(invoice.sale_date) }}</span>
                      <span>-</span>
                      <span>{{ fmtTime(invoice.sale_time, invoice.sale_date) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span>البائع:</span>
                      <span>{{ invoice.cashier_name }}</span>
                    </div>
                    <div>
                      <span class="text-sm text-gray-600">المحل</span>
                      <p class="font-semibold">
                        {{ invoice.shop?.name ?? "—" }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="text-left">
                  <div class="text-lg font-bold text-blue-600">
                    {{ fmtMoney(invoice.total) }} د.ع
                  </div>
                  <button
                    class="mt-1 text-xs px-2 py-1 border rounded"
                    type="button"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="totalPages > 1"
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-4"
          >
            <div class="text-xs text-gray-600">
              عرض {{ fromRecord }} - {{ toRecord }} من {{ total }} فاتورة
            </div>
            <div class="flex items-center gap-1">
              <button
                class="px-3 py-1 border rounded text-xs"
                :disabled="page === 1"
                @click="goToPage(page - 1)"
              >
                السابق
              </button>
              <button
                v-for="p in pages"
                :key="p"
                class="px-3 py-1 border rounded text-xs"
                :class="p === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'"
                @click="goToPage(p)"
              >
                {{ p }}
              </button>
              <button
                class="px-3 py-1 border rounded text-xs"
                :disabled="page === totalPages"
                @click="goToPage(page - 0 + 1)"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary of filtered invoices -->
    <div
      v-if="summary"
      class="bg-white/80 border border-blue-100 rounded-lg p-4 space-y-2 text-sm"
    >
      <h4 class="font-semibold text-blue-800 mb-1">
        ملخص فواتير المبيعات في الفترة المحددة
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div>
          <span class="text-xs text-gray-600">عدد الفواتير</span>
          <p class="font-semibold">{{ summary.count }}</p>
        </div>
        <div>
          <span class="text-xs text-gray-600">إجمالي المبيعات</span>
          <p class="font-semibold text-blue-600">
            {{ fmtMoney(summary.total_sum) }} د.ع
          </p>
        </div>
      </div>
    </div>

    <!-- Invoice Dialog -->
    <div
      v-if="isInvoiceDialogOpen && selectedInvoice"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isInvoiceDialogOpen = false"
    >
      <div
        class="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5"
        dir="rtl"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="flex items-center gap-2 text-lg font-semibold">
            تفاصيل الفاتورة {{ selectedInvoice.invoice_number }}
          </h3>
          <button
            class="px-3 py-1 border rounded"
            @click="isInvoiceDialogOpen = false"
          >
            إغلاق
          </button>
        </div>

        <div class="space-y-6">
          <!-- Invoice Info -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <span class="text-sm text-gray-600">رقم الفاتورة</span>
              <p class="font-semibold">
                {{ selectedInvoice.invoice_number }}
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-600">التاريخ</span>
              <p class="font-semibold">
                {{ fmtDate(selectedInvoice.sale_date) }}
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-600">الوقت</span>
              <p class="font-semibold">
                {{ fmtTime(selectedInvoice.sale_time, selectedInvoice.sale_date) }}
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-600">البائع</span>
              <p class="font-semibold">
                {{ selectedInvoice.cashier_name }}
              </p>
            </div>
          </div>

          <!-- Product Table -->
          <div>
            <h3 class="text-lg font-semibold mb-4">تفاصيل المنتجات</h3>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th class="border-b px-2 py-1 text-right">المنتج</th>
                  <th class="border-b px-2 py-1 text-right">السعر</th>
                  <th class="border-b px-2 py-1 text-right">الكمية</th>
                  <th class="border-b px-2 py-1 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in selectedInvoice.items"
                  :key="index"
                >
                  <td class="border-b px-2 py-1">
                    {{ item.product?.name ?? "—" }}
                  </td>
                  <td class="border-b px-2 py-1">
                    {{ fmtMoney(item.price) }} د.ع
                  </td>
                  <td class="border-b px-2 py-1">{{ item.quantity }}</td>
                  <td class="border-b px-2 py-1">
                    {{ fmtMoney(item.price * item.quantity) }} د.ع
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div class="border-t pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>المبلغ الإجمالي:</span>
              <span class="text-blue-600">
                {{ fmtMoney(selectedInvoice.total) }} د.ع
              </span>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              class="flex-1 px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              @click="handlePrint"
            >
              طباعة الفاتورة
            </button>
            <button
              v-if="selectedInvoice"
              class="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
              type="button"
              :disabled="deleting"
              @click="deleteSelectedInvoice"
            >
              {{ deleting ? "..." : "حذف" }}
            </button>
            <button
              class="px-4 py-2 rounded border"
              @click="isInvoiceDialogOpen = false"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div style="display: none">
          <div id="printable-receipt">
            <ReceiptTemplate
              v-if="selectedInvoice"
              :invoice="selectedInvoice"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import ReceiptTemplate from "@/components/ReceiptTemplate.vue";

interface SaleItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
  };
}

interface Shop {
  id: number;
  name: string;
}

interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  sale_time: string;
  total: number;
  cashier_name: string;
  shop: Shop;
  items: SaleItem[];
}

const auth = useAuthStore();

const sales = ref<Sale[]>([]);
const selectedInvoice = ref<Sale | null>(null);
const isInvoiceDialogOpen = ref(false);
const deleting = ref(false);

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const lastPage = ref(1);

// Summary over filtered invoices (from backend)
const summary = ref<{
  count: number;
  total_sum: number;
} | null>(null);

// Date filter
const dateFrom = ref<string>("");
const dateTo = ref<string>("");

onMounted(() => {
  fetchSales();
});

watch([page, pageSize], () => {
  fetchSales();
});

async function fetchSales() {
  try {
    const res = await axiosInstance.get("cashier/sales", {
      params: {
        page: page.value,
        limit: pageSize.value,
        source: "cashier",
        from: dateFrom.value || undefined,
        to: dateTo.value || undefined,
        ...(auth.user?.vendor_id ? { vendor_id: auth.user.vendor_id } : {}),
      },
    });
    const payload = res.data;
    sales.value = payload.data ?? payload;
    total.value = payload.total ?? sales.value.length;
    lastPage.value =
      payload.last_page ??
      (pageSize.value > 0
        ? Math.max(1, Math.ceil(total.value / pageSize.value))
        : 1);
    summary.value = payload.summary ?? null;
  } catch {
    alert("خطأ في تحميل الفواتير");
  }
}

const totalPages = computed(() => lastPage.value || 1);

const pages = computed(() => {
  const max = totalPages.value;
  const current = page.value;
  const windowSize = 5;

  let start = Math.max(1, current - 2);
  let end = Math.min(max, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const result: number[] = [];
  for (let p = start; p <= end; p++) {
    result.push(p);
  }
  return result;
});

const fromRecord = computed(() =>
  total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1
);
const toRecord = computed(() =>
  Math.min(page.value * pageSize.value, total.value)
);

function fmtDate(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toLocaleDateString("ar-IQ");
  if (typeof v === "string") return String(v).split("T")[0];
  return String(v);
}

function fmtTime(v: any, fallbackFrom?: any) {
  if (v) return String(v).split("T")[1]?.slice(0, 8) || String(v);
  const d = new Date(fallbackFrom);
  if (!isNaN(d.getTime()))
    return d.toLocaleTimeString("ar-IQ", { hour12: false });
  return "";
}

function fmtMoney(v: any) {
  const num = Number(v);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function onPageSizeChange() {
  page.value = 1;
}

function applyFilter() {
  page.value = 1;
}

function goToPage(target: number) {
  if (target < 1 || target > totalPages.value || target === page.value) return;
  page.value = target;
}

function openInvoiceDialog(invoice: Sale) {
  selectedInvoice.value = invoice;
  isInvoiceDialogOpen.value = true;
}

function handlePrint() {
  const printContents =
    document.getElementById("printable-receipt")?.innerHTML;
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (printWindow && printContents) {
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة الفاتورة</title>
        </head>
        <body dir="rtl" style="font-family: monospace;">
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

async function deleteSelectedInvoice() {
  if (!selectedInvoice.value) return;
  if (!window.confirm("هل أنت متأكد من حذف فاتورة المبيعات؟")) return;
  deleting.value = true;
  try {
    await axiosInstance.delete(`cashier/sales/${selectedInvoice.value.id}`);
    sales.value = sales.value.filter((s) => s.id !== selectedInvoice.value?.id);
    isInvoiceDialogOpen.value = false;
    selectedInvoice.value = null;
    // refresh totals/summary
    try {
      await fetchSales();
    } catch (_) {}
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر حذف الفاتورة");
  } finally {
    deleting.value = false;
  }
}
</script>


