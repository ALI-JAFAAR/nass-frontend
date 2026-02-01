<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left 2/3: Products & Barcode -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Barcode Input -->
      <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
        <div class="border-b px-4 py-3">
          <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
            قارئ الباركود
          </h2>
        </div>
        <div class="px-4 py-3">
          <form class="flex gap-2" @submit.prevent="handleBarcodeSubmit">
            <input
              v-model="barcode"
              placeholder="اكتب الباركود أو امسحه..."
              class="flex-1 border rounded px-3 py-2 text-center font-mono text-lg focus:outline-none focus:ring focus:ring-blue-200"
              autofocus
            />
            <button
              type="submit"
              class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              إضافة
            </button>
          </form>
        </div>
      </div>

      <!-- Product Search and List -->
      <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
        <div class="px-4 pt-4 pb-2 border-b">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
              المنتجات
            </h2>
          </div>
          <!-- Super admin: must choose a shop (vendor) to scope cashier catalog -->
          <div v-if="isSuperAdmin" class="mt-2">
            <select
              v-model="selectedVendorId"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option :value="0">اختر المتجر...</option>
              <option v-for="v in vendors" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </select>
            <p v-if="selectedVendorId === 0" class="mt-1 text-xs text-gray-600">
              يجب اختيار متجر لعرض منتجات نقطة البيع.
            </p>
          </div>
          <input
            v-model="searchTerm"
            placeholder="ابحث عن المنتجات..."
            class="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="border rounded-lg p-4 transition-all"
              :class="product.stock === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-blue-300 hover:shadow-lg'"
            >
              <div class="text-center">
                <h3 class="font-semibold text-gray-800">
                  {{ product.name }}
                </h3>
                <p class="text-lg font-bold text-blue-600">
                  {{ fmtMoney(product.price) }} د.ع
                </p>
                <span
                  class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                >
                  المتوفر: {{ product.stock }}
                </span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  class="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
                  :disabled="product.stock === 0"
                  @click="onAddProduct(product)"
                >
                  إضافة
                </button>
                <button
                  class="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
                  :disabled="product.stock === 0 || (product.variants?.length || 0) === 0"
                  @click="toggleVariants(product.id)"
                >
                  الخاصية/النوع
                </button>
              </div>
              <div
                v-if="expandedVariants[product.id] && (product.variants?.length || 0) > 0"
                class="mt-3 flex flex-wrap gap-2"
              >
                <button
                  v-for="v in product.variants"
                  :key="v.id"
                  class="px-2 py-1 rounded text-xs border bg-gray-50 hover:bg-blue-50"
                  @click="addToCart(product, v)"
                >
                  {{ variantLabel(v) }} • {{ fmtMoney(v.price) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right 1/3: Cart -->
    <div class="space-y-4 lg:sticky lg:top-24">
      <div class="bg-white/80 border border-blue-100 rounded-lg">
        <div class="px-4 py-3 border-b">
          <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
            سلة المشتريات
          </h2>
        </div>
        <div class="p-4 space-y-4">
          <p v-if="cart.length === 0" class="text-center text-gray-500 py-8">
            السلة فارغة
          </p>
          <template v-else>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="item in cart"
                :key="item.id + '_' + (item.variantId || 0)"
                class="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">
                    {{ item.name }}
                  </h4>
                  <p class="text-sm text-blue-600">
                    {{ fmtMoney(item.price) }} د.ع
                    <span
                      v-if="item.variantLabel"
                      class="ml-2 text-gray-600"
                    >
                      ({{ item.variantLabel }})
                    </span>
                  </p>
                  <!-- Variant selector inside cart -->
                  <div
                    v-if="productVariants(item.id).length"
                    class="mt-2 flex flex-wrap gap-2"
                  >
                    <button
                      v-for="v in productVariants(item.id)"
                      :key="'cart-var-' + item.id + '-' + v.id"
                      class="px-2 py-1 rounded text-xs border"
                      :class="v.id === item.variantId
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-800'"
                      @click="onChangeLineVariant(item, v)"
                    >
                      {{ variantLabel(v) }}
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="px-2 py-1 border rounded text-xs"
                    @click="updateQuantity(item.id, item.quantity - 1, item.variantId)"
                  >
                    -
                  </button>
                  <span class="w-6 text-center">
                    {{ item.quantity }}
                  </span>
                  <button
                    class="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    :disabled="isAtStockLimit(item)"
                    @click="increaseQuantity(item)"
                  >
                    +
                  </button>
                  <button
                    class="px-2 py-1 rounded text-xs bg-red-600 text-white"
                    @click="updateQuantity(item.id, 0, item.variantId)"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>

            <div class="border-t pt-3 mt-2 flex justify-between text-lg font-bold">
              <span>الإجمالي:</span>
              <span class="text-blue-600">{{ fmtMoney(total) }} د.ع</span>
            </div>

            <button
              class="w-full mt-2 px-4 py-2 rounded bg-green-600 text-white flex items-center justify-center gap-2"
              @click="handleCheckoutAndPrint"
            >
              إتمام البيع وطباعة الإيصال
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

interface Variant {
  id: number;
  price: number;
  stock?: number | null;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  stock: number;
  variants?: Variant[];
}

interface CartItem extends Product {
  quantity: number;
  variantId?: number;
  variantLabel?: string;
}

const auth = useAuthStore();
const isSuperAdmin = computed(() => !auth.user?.vendor_id);

const vendors = ref<any[]>([]);
const selectedVendorId = ref<number>(Number(localStorage.getItem("vendor_id") || 0));

const products = ref<Product[]>([]);
const cart = ref<CartItem[]>([]);
const searchTerm = ref("");
const barcode = ref("");

const expandedVariants = reactive<Record<number, boolean>>({});

async function fetchVendors() {
  if (!isSuperAdmin.value) return;
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  vendors.value = Array.isArray(list) ? list : [];
}

async function fetchProducts() {
  const params: any = {};

  if (auth.user?.vendor_id) {
    params.vendor_id = auth.user.vendor_id;
  } else if (isSuperAdmin.value) {
    const vid = Number(selectedVendorId.value || 0);
    if (!vid) {
      products.value = [];
      return;
    }
    params.vendor_id = vid;
  }

  const res = await axiosInstance.get("v1/cashier/products", { params });
  const list = res.data?.data ?? [];
  products.value = Array.isArray(list) ? list : [];
}

onMounted(async () => {
  await fetchVendors();
  await fetchProducts();
});

// Persist selected vendor for super admin so axios can send X-Vendor-Id too.
watch(
  () => selectedVendorId.value,
  (val) => {
    if (!isSuperAdmin.value) return;
    const v = Number(val || 0);
    if (v > 0) {
      localStorage.setItem("vendor_id", String(v));
      axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(v);
      fetchProducts();
    } else {
      localStorage.removeItem("vendor_id");
      delete axiosInstance.defaults.headers.common["X-Vendor-Id"];
      products.value = [];
    }
  },
);

const filteredProducts = computed(() =>
  products.value.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);

const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

function variantLabel(v: Variant): string {
  return [v.color, v.size].filter(Boolean).join(" • ") || `#${v.id}`;
}

function productVariants(productId: number): Variant[] {
  const p = products.value.find((x) => x.id === productId);
  return p?.variants ?? [];
}

function addToCart(product: Product, variant?: Variant) {
  const keyMatch = (item: CartItem) =>
    item.id === product.id && (item.variantId ?? 0) === (variant?.id ?? 0);
  const found = cart.value.find(keyMatch);

  // Stock guard
  if (variant) {
    const vStock =
      typeof variant.stock === "number" ? (variant.stock as number) : null;
    if (vStock !== null && vStock <= 0) {
      alert("هذه الخاصية غير متوفرة في المخزون");
      return;
    }
  } else if (product.stock === 0) {
    alert("المنتج غير متوفر في المخزون");
    return;
  }

  if (found) {
    // Additional guard per-variant when selected
    if (variant && typeof variant.stock === "number") {
      if (found.quantity >= (variant.stock ?? 0)) {
        alert("لا يمكن إضافة كمية أكثر من المتوفر في المخزون لهذه الخاصية");
        return;
      }
    } else {
      if (found.quantity >= product.stock) {
        alert("لا يمكن إضافة كمية أكثر من المتوفر في المخزون");
        return;
      }
    }
    cart.value = cart.value.map((item) =>
      keyMatch(item)
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );
  } else {
    const v = variant;
    cart.value = [
      ...cart.value,
      {
        ...product,
        price: v?.price ?? product.price,
        variantId: v?.id,
        variantLabel: v ? variantLabel(v) : undefined,
        quantity: 1,
      },
    ];
  }
}

function updateQuantity(id: number, qty: number, variantId?: number) {
  if (qty <= 0) {
    cart.value = cart.value.filter(
      (item) => !(item.id === id && (item.variantId ?? 0) === (variantId ?? 0))
    );
  } else {
    cart.value = cart.value.map((item) =>
      item.id === id && (item.variantId ?? 0) === (variantId ?? 0)
        ? { ...item, quantity: qty }
        : item
    );
  }
}

function handleBarcodeSubmit() {
  const product = products.value.find((p) => p.sku === barcode.value);
  if (product) {
    const variants = product.variants ?? [];
    if (variants.length > 1) {
      expandedVariants[product.id] = true;
    } else if (variants.length === 1) {
      addToCart(product, variants[0]);
    } else {
      addToCart(product);
    }
    barcode.value = "";
  } else {
    alert("المنتج غير موجود");
  }
}

function fmtMoney(v: any): string {
  const num = Number(v);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toggleVariants(productId: number) {
  expandedVariants[productId] = !expandedVariants[productId];
}

function isAtStockLimit(item: CartItem): boolean {
  const p = products.value.find((pp) => pp.id === item.id);
  const pVariants = p?.variants ?? [];
  const currentVariant = pVariants.find((v) => v.id === item.variantId);
  const vStock =
    typeof currentVariant?.stock === "number"
      ? (currentVariant.stock as number)
      : undefined;
  const pStock = p?.stock ?? undefined;
  const limit = vStock ?? pStock;
  return typeof limit === "number" ? item.quantity >= limit : false;
}

function increaseQuantity(item: CartItem) {
  if (isAtStockLimit(item)) {
    alert("لا يمكن إضافة كمية أكثر من المتوفر في المخزون");
    return;
  }
  updateQuantity(item.id, item.quantity + 1, item.variantId);
}

function onAddProduct(product: Product) {
  const variants = product.variants ?? [];
  if (variants.length === 1) {
    addToCart(product, variants[0]);
  } else {
    addToCart(product);
  }
}

function onChangeLineVariant(item: CartItem, v: Variant) {
  if (v.id === item.variantId) return;
  const vStock = typeof v.stock === "number" ? (v.stock as number) : undefined;
  const newQty = item.quantity;
  if (vStock !== undefined && newQty > vStock) {
    alert("الكمية تتجاوز المتوفر لهذه الخاصية");
    return;
  }

  const updatedLine = {
    ...item,
    variantId: v.id,
    variantLabel: variantLabel(v),
    price: v.price,
  } as CartItem;

  const existingIdx = cart.value.findIndex(
    (ci) => ci.id === item.id && (ci.variantId ?? 0) === v.id
  );

  if (existingIdx >= 0) {
    const next = [...cart.value];
    next[existingIdx] = {
      ...next[existingIdx]!,
      quantity: next[existingIdx]!.quantity + newQty,
    };
    const curIdx = next.findIndex(
      (ci) =>
        ci.id === item.id && (ci.variantId ?? 0) === (item.variantId ?? 0)
    );
    if (curIdx >= 0) next.splice(curIdx, 1);
    cart.value = next;
  } else {
    cart.value = cart.value.map((ci) =>
      ci.id === item.id && (ci.variantId ?? 0) === (item.variantId ?? 0)
        ? updatedLine
        : ci
    );
  }
}

async function handleCheckoutAndPrint() {
  if (cart.value.length === 0) {
    alert("السلة فارغة");
    return;
  }

  const productsById = new Map(products.value.map((p) => [p.id, p]));
  for (const item of cart.value) {
    const p = productsById.get(item.id);
    const variants = p?.variants ?? [];
    if (variants.length > 1 && !item.variantId) {
      alert(`يجب اختيار نوع او خاصية للمنتج: ${p?.name ?? item.name}`);
      return;
    }
  }

  const now = new Date();
  const invoiceNumber = `INV-${now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

  try {
    const salePayload = {
      vendor_id: auth.user?.vendor_id ?? null,
      cashier_name: auth.user?.name ?? undefined,
      invoice_number: invoiceNumber,
      total: total.value,
      items: cart.value.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        ...(item.variantId ? { variant_id: item.variantId } : {}),
      })),
    };
    await axiosInstance.post("cashier/sales", salePayload);
    const saleData = {
      invoice_number: invoiceNumber,
      date: now.toLocaleDateString(),
      items: cart.value,
      total: total.value,
    };
    cart.value = [];
    printReceiptInNewTab(generateReceiptHtml(saleData));
  } catch (err) {
    console.error("Error saving sale:", err);
    alert("فشل في حفظ الفاتورة");
  }
}

function generateReceiptHtml(sale: any): string {
  return `
    <div id="receipt-content" style="font-family:monospace;width:302px;padding:10px;font-size:13px;line-height:1.4;color:#000;">
      <div style="text-align:center;font-weight:bold;font-size:17px;margin-bottom:6px;">
        إيصال مبيعات
      </div>
      <div style="margin-bottom:8px;">
        <div style="margin-bottom:4px;"><strong>رقم الفاتورة:</strong> ${
          sale.invoice_number
        }</div>
        <div style="margin-bottom:4px;"><strong>التاريخ:</strong> ${
          sale.date
        }</div>
      </div>
      <hr style="margin:8px 0;" />
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px dashed #000;">
            <th style="text-align:right;">المنتج</th>
            <th style="text-align:center;">الكمية</th>
            <th style="text-align:center;">السعر</th>
            <th style="text-align:left;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items
            .map(
              (item: any) => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:center;">${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align:left;">${(Number(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <hr style="margin:8px 0;" />

      <div style="font-weight:bold;text-align:right;font-size:15px;margin-bottom:10px;">
        الإجمالي: ${Number(sale.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ع
      </div>
      <hr style="margin:10px 0;" />
      <div style="text-align:center;">
        <div id="qr-code" style="display:inline-block;"></div>
        <div style="font-size:10px;margin-top:5px;">نظام كاشير المودة 07736657369</div>
      </div>
    </div>
  `;
}

function printReceiptInNewTab(receiptHtml: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>إيصال مبيعات</title>
        <style>
          body { font-family: 'monospace', Tahoma, Arial, sans-serif; margin: 0; background: #fff; }
          @media print {
            html, body { background: #fff !important; }
          }
        </style>
      </head>
      <body dir="rtl" style="background:#fff;">
        ${receiptHtml}
        <script>
          window.onload = function() { window.print(); setTimeout(() => window.close(), 1500); };
        <\/script>
        <script>
          window.onload = function() { window.print(); setTimeout(() => window.close(), 1500); };
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
}
</script>


