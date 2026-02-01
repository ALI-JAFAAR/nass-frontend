<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center">
        <div>
          <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
            فواتير الشراء
          </h2>
          <p class="text-sm text-gray-500">عدد الفواتير: {{ total }}</p>
        </div>
        <button
          class="px-4 py-2 rounded bg-blue-600 text-white"
          @click="openInvoiceDialog"
        >
          إضافة فاتورة شراء
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 border-b">
        <h3 class="flex items-center gap-2 text-blue-800 font-semibold">
          قائمة فواتير الشراء
        </h3>
      </div>
      <div class="p-4">
        <div
          v-for="purchase in purchases"
          :key="purchase.id"
          class="mb-4 p-4 border rounded cursor-pointer hover:shadow"
          @click="openDetails(purchase)"
        >
          <div class="flex justify-between">
            <div>
              <strong>{{ purchase.invoice_number }}</strong> -
              {{ purchase.supplier_name }}
              <div class="text-sm text-gray-600">
                {{ purchase.purchase_date }} - {{ purchase.purchase_time }}
              </div>
            </div>
            <div class="text-blue-600 font-bold text-lg">
              {{ fmtMoney(purchase.total) }} د.ع
            </div>
          </div>
        </div>
        <div v-if="totalPages > 1" class="flex justify-end gap-2 pt-4 items-center">
          <button
            class="px-3 py-1 border rounded text-sm"
            :disabled="page === 1"
            @click="page--"
          >
            السابق
          </button>
          <span class="px-2">صفحة {{ page }} من {{ totalPages }}</span>
          <button
            class="px-3 py-1 border rounded text-sm"
            :disabled="page === totalPages || totalPages === 0"
            @click="page++"
          >
            التالي
          </button>
          <select
            v-model.number="pageSize"
            class="ml-2 border rounded px-1 py-1 text-sm"
            @change="onPageSizeChange"
          >
            <option v-for="size in [5,10,20,50,100]" :key="size" :value="size">
              {{ size }} / صفحة
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Create Invoice Dialog -->
    <div
      v-if="dialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="dialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-4xl p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">فاتورة شراء جديدة</h3>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block mb-1 text-sm">رقم الفاتورة</label>
              <input
                v-model="invoice.invoice_number"
                required
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label class="block mb-1 text-sm">المورد</label>
              <input
                v-model="invoice.supplier_name"
                required
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label class="block mb-1 text-sm">تاريخ الشراء</label>
              <input
                v-model="invoice.purchase_date"
                type="date"
                required
                class="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="grid grid-cols-1 md:grid-cols-5 gap-3 bg-blue-50 p-3 rounded"
            >
              <div>
                <label class="block mb-1 text-sm">المنتج</label>
                <select
                  v-model.number="item.product_id"
                  class="w-full border rounded px-2 py-2"
                >
                  <option :value="0">اختر منتج</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
                <button
                  type="button"
                  class="mt-2 w-full px-3 py-2 rounded border text-sm bg-white hover:bg-gray-50"
                  @click="openCreateProduct(index)"
                >
                  + إضافة منتج جديد
                </button>
              </div>
              <div>
                <label class="block mb-1 text-sm">الكمية</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  class="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm">سعر الشراء</label>
                <input
                  v-model.number="item.purchase_price"
                  type="number"
                  class="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm">سعر البيع</label>
                <input
                  v-model.number="item.sale_price"
                  type="number"
                  class="w-full border rounded px-3 py-2"
                />
              </div>
              <div class="flex items-end">
                <button
                  type="button"
                  class="px-3 py-2 rounded bg-red-600 text-white"
                  @click="removeItem(index)"
                >
                  حذف
                </button>
              </div>
            </div>
            <button
              type="button"
              class="px-3 py-2 border rounded"
              @click="addItem"
            >
              + بند جديد
            </button>
          </div>

          <div class="bg-gray-100 p-4 flex justify-between font-bold">
            <span>الإجمالي:</span>
            <span class="text-blue-600">
              {{ fmtMoney(calculateTotal()) }} د.ع
            </span>
          </div>

          <button
            type="submit"
            class="w-full px-4 py-2 rounded bg-green-600 text-white"
          >
            حفظ الفاتورة
          </button>
        </form>
      </div>
    </div>

    <!-- Details Dialog -->
    <div
      v-if="showDetails && selectedPurchase"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="showDetails = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-4xl p-5" dir="rtl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            تفاصيل الفاتورة {{ selectedPurchase.invoice_number }}
          </h3>
          <button class="px-3 py-1 border rounded" @click="showDetails = false">
            إغلاق
          </button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs text-gray-600">المورد</label>
              <p>{{ selectedPurchase.supplier_name }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600">التاريخ</label>
              <p>{{ fmtDate(selectedPurchase.purchase_date) }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600">الوقت</label>
              <p>
                {{
                  fmtTime(
                    selectedPurchase.purchase_time,
                    selectedPurchase.purchase_date
                  )
                }}
              </p>
            </div>
            <div>
              <label class="block text-xs text-gray-600">الإجمالي</label>
              <p class="text-blue-600 font-bold">
                {{ fmtMoney(selectedPurchase.total) }} د.ع
              </p>
            </div>
          </div>

          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th class="border-b px-2 py-1 text-right">المنتج</th>
                <th class="border-b px-2 py-1 text-right">الكمية</th>
                <th class="border-b px-2 py-1 text-right">سعر الشراء</th>
                <th class="border-b px-2 py-1 text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in (selectedPurchase.items || [])"
                :key="i"
              >
                <td class="border-b px-2 py-1">
                  {{ item.product?.name || getProductName(item.product_id) || "—" }}
                </td>
                <td class="border-b px-2 py-1">{{ item.quantity }}</td>
                <td class="border-b px-2 py-1">
                  {{ fmtMoney(item.purchase_price) }}
                </td>
                <td class="border-b px-2 py-1">
                  {{ fmtMoney(item.purchase_price * item.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="flex gap-2 pt-4">
            <button
              class="flex-1 px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              @click="handlePrint"
            >
              طباعة الفاتورة
            </button>
            <button
              class="px-4 py-2 rounded border"
              @click="showDetails = false"
            >
              إغلاق
            </button>
          </div>
        </div>
        <div style="display: none">
          <div id="purchase-printable-receipt">
            <PurchaseReceiptTemplate
              v-if="selectedPurchase"
              :invoice="selectedPurchase"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create product dialog (inline from purchases) -->
    <div
      v-if="createProductOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="createProductOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-lg p-5" dir="rtl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">إضافة منتج جديد</h3>
          <button class="px-3 py-1 border rounded" @click="createProductOpen = false">
            إغلاق
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block mb-1 text-sm">اسم المنتج *</label>
            <input v-model="newProductName" class="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block mb-1 text-sm">SKU (اختياري)</label>
            <input v-model="newProductSku" class="w-full border rounded px-3 py-2" />
          </div>

          <button
            class="w-full px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
            type="button"
            :disabled="creatingProduct"
            @click="createProduct"
          >
            {{ creatingProduct ? "..." : "حفظ المنتج" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import PurchaseReceiptTemplate from "@/components/PurchaseReceiptTemplate.vue";

interface Product {
  id: number;
  name: string;
  shop_id?: number;
}

interface PurchaseItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  purchase_price: number;
  sale_price?: number;
}

interface Purchase {
  id: number;
  invoice_number: string;
  supplier_name: string;
  total: number;
  purchase_date: string;
  purchase_time: string;
  items: PurchaseItem[];
  shop_id?: number;
}

const auth = useAuthStore();

const purchases = ref<Purchase[]>([]);
const products = ref<Product[]>([]);
const dialogOpen = ref(false);
const invoice = ref({
  invoice_number: "",
  supplier_name: "",
  purchase_date: "",
});
const items = ref<PurchaseItem[]>([]);
const selectedPurchase = ref<Purchase | null>(null);
const showDetails = ref(false);

const createProductOpen = ref(false);
const createProductForIndex = ref<number>(0);
const newProductName = ref("");
const newProductSku = ref("");
const creatingProduct = ref(false);

const page = ref(1);
const pageSize = ref(5);
const total = ref(0);

onMounted(async () => {
  await fetchProducts();
});

async function fetchProducts() {
  const params: any = {};
  if (auth.user?.vendor_id) params.vendor_id = auth.user.vendor_id;
  const res = await axiosInstance.get("v1/products", { params });
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  products.value = Array.isArray(list) ? list : [];
}

function openCreateProduct(index: number) {
  createProductForIndex.value = index;
  newProductName.value = "";
  newProductSku.value = "";
  createProductOpen.value = true;
}

async function createProduct() {
  const name = newProductName.value.trim();
  const sku = newProductSku.value.trim();
  if (!name) {
    alert("يرجى إدخال اسم المنتج");
    return;
  }
  creatingProduct.value = true;
  try {
    const payload: any = {
      name,
      sku: sku || `SKU-${Date.now()}`,
      vendor_id: auth.user?.vendor_id ?? undefined,
      is_active: 1,
      featured: 0,
    };
    const res = await axiosInstance.post("v1/admin/products", payload);
    const created = res.data as any;
    // refresh list then select
    await fetchProducts();
    const idx = createProductForIndex.value;
    if (items.value[idx]) {
      items.value[idx].product_id = Number(created?.id) || 0;
    }
    createProductOpen.value = false;
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر إنشاء المنتج");
  } finally {
    creatingProduct.value = false;
  }
}

watch([page, pageSize], () => {
  fetchPurchases();
});

async function fetchPurchases() {
  try {
    const params: any = {
      page: page.value,
      limit: pageSize.value,
      vendor_id: auth.user?.vendor_id ?? undefined,
    };
    const res = await axiosInstance.get("cashier/purchases", { params });
    purchases.value = res.data.data;
    total.value = res.data.total;
  } catch {
    alert("خطأ في تحميل الفواتير");
  }
}

function addItem() {
  items.value.push({
    product_id: 0,
    quantity: 1,
    purchase_price: 0,
  });
}

function updateItem(index: number, field: keyof PurchaseItem, value: any) {
  const updated = [...items.value];
  (updated[index] as any)[field] =
    field === "quantity" ? parseInt(value) : value;
  items.value = updated;
}

function removeItem(index: number) {
  if (items.value.length === 1) return;
  items.value = items.value.filter((_, i) => i !== index);
}

function getProductName(id: number) {
  return products.value.find((p) => p.id === id)?.name || "";
}

function calculateTotal() {
  return items.value.reduce(
    (sum, i) => sum + i.purchase_price * i.quantity,
    0
  );
}

async function handleSubmit() {
  const data = {
    ...invoice.value,
    items: items.value,
    vendor_id: auth.user?.vendor_id ?? null,
  };
  try {
    await axiosInstance.post("cashier/purchases", data);
    alert("تم حفظ فاتورة الشراء بنجاح");
    dialogOpen.value = false;
    invoice.value = {
      invoice_number: "",
      supplier_name: "",
      purchase_date: "",
    };
    items.value = [];
    page.value = 1;
    fetchPurchases();
  } catch {
    alert("حدث خطأ في الحفظ");
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

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

function handlePrint() {
  const content =
    document.getElementById("purchase-printable-receipt")?.innerHTML;
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (printWindow && content) {
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head><title>طباعة فاتورة الشراء</title></head>
        <body dir="rtl" style="font-family: monospace;">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

function openInvoiceDialog() {
  dialogOpen.value = true;
  items.value = [
    {
      product_id: 0,
      quantity: 1,
      purchase_price: 0,
    },
  ];
}

function openDetails(purchase: Purchase) {
  selectedPurchase.value = purchase;
  showDetails.value = true;
}

function onPageSizeChange() {
  page.value = 1;
}
</script>


