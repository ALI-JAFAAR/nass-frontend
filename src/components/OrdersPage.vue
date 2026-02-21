<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
      <div class="px-4 py-3">
        <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
          إدارة الطلبات
        </h2>
        <p class="text-sm text-gray-600">
          إجمالي الطلبات: {{ total }}
        </p>
      </div>
    </div>

    <!-- Filters + Orders list -->
    <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
      <div class="px-4 py-3 border-b">
        <div class="flex flex-col gap-3">
          <div
            class="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <h3 class="flex items-center gap-2 text-blue-800 font-semibold">
              قائمة الطلبات
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
                  v-model.number="perPage"
                  @change="changePerPage"
                  class="border rounded px-2 py-1 text-sm"
                >
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="15">15</option>
                  <option :value="25">25</option>
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

          <!-- Advanced filters row -->
          <div
            class="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs text-gray-700"
          >
            <div>
              <label class="block mb-1">حالة الطلب</label>
              <select
                v-model="statusFilter"
                class="border rounded px-2 py-1 text-sm w-full"
              >
                <option value="">كل الحالات</option>
                <option v-for="s in statuses" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-1">اسم العميل</label>
              <input
                v-model="customerName"
                type="text"
                class="border rounded px-2 py-1 text-sm w-full"
                placeholder="بحث باسم العميل"
              />
            </div>
            <div>
              <label class="block mb-1">هاتف العميل</label>
              <input
                v-model="customerPhone"
                type="text"
                class="border rounded px-2 py-1 text-sm w-full"
                placeholder="مثال: 07..."
              />
            </div>
            <div>
              <label class="block mb-1">رقم الطلب</label>
              <input
                v-model="orderId"
                type="text"
                class="border rounded px-2 py-1 text-sm w-full"
                placeholder="ID"
              />
            </div>
            <div>
              <label class="block mb-1">المحل / البائع (اسم المحل)</label>
              <input
                v-model="vendorName"
                type="text"
                class="border rounded px-2 py-1 text-sm w-full"
                placeholder="بحث باسم المحل (للمشرف)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div v-if="orders.length === 0" class="text-center py-8 text-gray-500">
          لا توجد طلبات بعد
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="order in orders"
            :key="order.id"
            class="border rounded-lg p-3 cursor-pointer hover:shadow-sm transition"
            @click="openOrder(order)"
          >
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-block px-2 py-0.5 rounded-full border text-xs text-blue-600 border-blue-300"
                  >
                    رقم {{ order.id }}
                  </span>
                  <span class="text-sm text-gray-600">
                    {{ order.customer?.name ?? "زائر" }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>
                    {{ fmtDate(order.created_at) }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full bg-gray-100">
                    الحالة: {{ order.status }}
                  </span>
                  <span v-if="order.customer?.phone" class="px-2 py-0.5 rounded-full bg-gray-100">
                    {{ order.customer.phone }}
                  </span>
                  <span v-if="order.delivery_city_name || order.delivery_region_name" class="px-2 py-0.5 rounded-full bg-gray-100">
                    {{ (order.delivery_city_name ?? "—") }} • {{ (order.delivery_region_name ?? "—") }}
                  </span>
                </div>
              </div>
              <div class="text-left">
                <div class="text-lg font-bold text-blue-600">
                  {{ fmtMoney(order.total) }} د.ع
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="totalPages > 1"
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-4"
          >
            <div class="text-xs text-gray-600">
              عرض {{ fromRecord }} - {{ toRecord }} من {{ total }} طلب
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

    <!-- Summary of filtered orders -->
    <div
      v-if="summary"
      class="bg-white/80 border border-blue-100 rounded-lg p-4 space-y-2 text-sm"
    >
      <h4 class="font-semibold text-blue-800 mb-1">ملخص الطلبات في الفترة المحددة</h4>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>
          <span class="text-xs text-gray-600">عدد الطلبات</span>
          <p class="font-semibold">{{ summary.count }}</p>
        </div>
        <div>
          <span class="text-xs text-gray-600">المجموع الفرعي</span>
          <p class="font-semibold">{{ fmtMoney(summary.subtotal_sum) }} د.ع</p>
        </div>
        <div>
          <span class="text-xs text-gray-600">إجمالي الخصومات</span>
          <p class="font-semibold">{{ fmtMoney(summary.discount_sum) }} د.ع</p>
        </div>
        <div>
          <span class="text-xs text-gray-600">إجمالي التوصيل</span>
          <p class="font-semibold">{{ fmtMoney(summary.shipping_sum) }} د.ع</p>
        </div>
        <div>
          <span class="text-xs text-gray-600">إجمالي الفواتير</span>
          <p class="font-semibold text-blue-600">
            {{ fmtMoney(summary.total_sum) }} د.ع
          </p>
        </div>
      </div>
    </div>

    <!-- Order details dialog -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="selectedOrder = null"
    >
      <div
        class="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5"
        dir="rtl"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            تفاصيل الطلب رقم {{ selectedOrder.id }}
          </h3>
          <div class="flex items-center gap-2">
            <button
              v-if="selectedOrder?.customer?.phone"
              class="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
              @click="openWhatsApp(selectedOrder as any)"
              title="إرسال واتساب"
            >
              واتساب
            </button>
            <button
              class="px-3 py-1 border rounded"
              @click="selectedOrder = null"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Top summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-3 rounded">
            <div>
              <span class="text-xs text-gray-600">العميل</span>
              <p class="font-semibold">
                {{ selectedOrder.customer?.name ?? "زائر" }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">الهاتف</span>
              <p class="font-semibold">
                {{ selectedOrder.customer?.phone ?? "—" }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">رقم الطلب</span>
              <p class="font-semibold">
                {{ selectedOrder.id }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">التاريخ</span>
              <p class="font-semibold">
                {{ fmtDate(selectedOrder.created_at) }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">طريقة الدفع</span>
              <p class="font-semibold">
                {{ selectedOrder.payment_method ?? "cod" }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">المجموع الفرعي</span>
              <p class="font-semibold">
                {{ fmtMoney(selectedOrder.subtotal ?? 0) }} د.ع
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">الخصم</span>
              <p class="font-semibold">
                {{ fmtMoney(selectedOrder.discount_total ?? 0) }} د.ع
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">تكلفة التوصيل</span>
              <p class="font-semibold">
                {{ fmtMoney(selectedOrder.shipping_fee ?? 0) }} د.ع
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-600">الإجمالي</span>
              <p class="font-semibold text-blue-600">
                {{ fmtMoney(selectedOrder.total) }} د.ع
              </p>
            </div>
            <div class="md:col-span-2">
              <span class="text-xs text-gray-600">الحالة</span>
              <select
                v-model="statusDraft"
                class="w-full border rounded px-2 py-1 text-sm"
              >
                <option v-for="s in statuses" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
            </div>
          </div>

          <!-- Address / notes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold mb-1 text-sm">العنوان</h4>
              <p class="text-sm text-gray-700">
                {{ selectedOrder.address_text ?? "—" }}
              </p>
            </div>
            <div>
              <h4 class="font-semibold mb-1 text-sm">ملاحظات</h4>
              <p class="text-sm text-gray-700">
                {{ selectedOrder.notes ?? "—" }}
              </p>
            </div>
            <div class="md:col-span-2">
              <h4 class="font-semibold mb-1 text-sm">ملاحظات للمندوب (Modon)</h4>
              <p class="text-sm text-gray-700">
                {{ (selectedOrder as any).merchant_notes ?? "—" }}
              </p>
            </div>
          </div>

          <!-- Delivery provider (Modon) info -->
          <div class="rounded-lg border p-4 bg-amber-50/40">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="font-semibold text-sm">شركة التوصيل (Modon)</h4>
                <p class="text-xs text-gray-600 mt-1">
                  يتم استخدام مدينة/منطقة مودن المسجلة داخل الطلب من تطبيق الموظف — لا حاجة لاختيارها مرة أخرى هنا.
                </p>
              </div>
              <div class="text-xs text-gray-500">
                <span v-if="selectedOrder.delivery_external_id" class="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                  تم الإرسال: {{ selectedOrder.delivery_external_id }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label class="block text-xs text-gray-600 mb-1">المدينة</label>
                <div class="w-full border rounded px-2 py-2 text-sm bg-white">
                  {{ selectedOrder.delivery_city_name ?? (selectedOrder.delivery_city_id ? ("#" + selectedOrder.delivery_city_id) : "—") }}
                </div>
              </div>

              <div>
                <label class="block text-xs text-gray-600 mb-1">المنطقة</label>
                <div class="w-full border rounded px-2 py-2 text-sm bg-white">
                  {{ selectedOrder.delivery_region_name ?? (selectedOrder.delivery_region_id ? ("#" + selectedOrder.delivery_region_id) : "—") }}
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.delivery_error" class="mt-3 text-xs text-red-700">
              {{ selectedOrder.delivery_error }}
            </div>
          </div>

          <!-- Fast/internal delivery assignment -->
          <div v-if="canManageSalesInvoices" class="rounded-lg border p-4 bg-blue-50/40">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 class="font-semibold text-sm">توصيل سريع (مندوب الشركة)</h4>
                <p class="text-xs text-gray-600 mt-1">
                  يمكنك تحويل الطلب إلى توصيل داخلي وتعيينه لمندوب. لا يتم الإرسال إلى مودن.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <select v-model.number="fastBoyId" class="border rounded px-2 py-2 text-sm bg-white min-w-[220px]">
                  <option :value="0">اختر المندوب (Delivery boy)</option>
                  <option v-for="u in deliveryBoys" :key="u.id" :value="u.id">
                    {{ u.name || u.username }} — {{ u.commission_type ? (u.commission_type === 'percent' ? (u.commission_value + '%') : (u.commission_value + ' د.ع')) : 'بدون عمولة' }}
                  </option>
                </select>
                <button
                  class="px-3 py-2 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                  :disabled="fastBusy || !selectedOrder"
                  @click="assignFast(false)"
                >
                  تعيين سريع
                </button>
                <button
                  class="px-3 py-2 rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50"
                  type="button"
                  :disabled="fastBusy || !selectedOrder"
                  @click="assignFast(true)"
                >
                  تحويل من مودن إلى سريع
                </button>
                <button
                  class="px-3 py-2 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"
                  type="button"
                  :disabled="fastBusy || !selectedOrder"
                  @click="settleFast()"
                >
                  تسوية (إضافة عمولة المندوب)
                </button>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-700">
              <div>
                <span class="text-gray-500">المندوب الحالي:</span>
                <span class="font-semibold">
                  {{ (selectedOrder as any).fast_delivery_boy_id ? ((selectedOrder as any).fast_delivery_boy_id) : "—" }}
                </span>
              </div>
              <div class="mt-1">
                <span class="text-gray-500">التسليم:</span>
                <span class="font-semibold">{{ (selectedOrder as any).fast_delivered_at ? "تم" : "—" }}</span>
                <span class="text-gray-500 mr-3">التسوية:</span>
                <span class="font-semibold">{{ (selectedOrder as any).fast_settled_at ? "تم" : "—" }}</span>
              </div>
            </div>
          </div>

          <!-- Suspended note -->
          <div v-if="statusDraft === 'suspended'" class="rounded-lg border p-4 bg-rose-50/40">
            <h4 class="font-semibold text-sm">الطلب معلق</h4>
            <p class="text-xs text-gray-600 mt-1">
              اكتب سبب التعليق (سيصل كإشعار للموظف الذي أنشأ الطلب).
            </p>
            <textarea
              v-model="suspendedNoteDraft"
              class="w-full border rounded px-3 py-2 text-sm mt-3"
              rows="3"
              placeholder="مثال: الرقم غير داخل بالخدمة / الرقم خطأ / يرجى التواصل عبر انستا..."
            />
          </div>

          <!-- Items -->
          <div>
            <h4 class="font-semibold mb-2">المنتجات</h4>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th class="border-b px-2 py-1 text-right">المنتج</th>
                  <th class="border-b px-2 py-1 text-right">الكمية</th>
                  <th class="border-b px-2 py-1 text-right">السعر</th>
                  <th class="border-b px-2 py-1 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in (selectedOrder.items || [])"
                  :key="idx"
                >
                  <td class="border-b px-2 py-1">
                    {{ item.product?.name ?? item.meta?.name ?? "—" }}
                  </td>
                  <td class="border-b px-2 py-1">
                    {{ item.quantity }}
                  </td>
                  <td class="border-b px-2 py-1">
                    {{ fmtMoney(item.unit_price ?? item.price ?? 0) }} د.ع
                  </td>
                  <td class="border-b px-2 py-1">
                    {{ fmtMoney(item.line_total ?? (item.unit_price ?? item.price ?? 0) * item.quantity) }} د.ع
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Status log / timeline -->
          <div v-if="selectedOrder.status_logs?.length" class="pt-2">
            <h4 class="font-semibold mb-1 text-sm">سجل الحالات</h4>
            <ul class="text-xs text-gray-700 space-y-1 max-h-40 overflow-y-auto">
              <li
                v-for="(log, i) in selectedOrder.status_logs"
                :key="i"
                class="flex justify-between gap-3"
              >
                <span>{{ log.status }}</span>
                <span class="text-gray-500">
                  {{ fmtDate(log.created_at) }}
                </span>
              </li>
            </ul>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              v-if="canManageSalesInvoices"
              class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
              :disabled="saving"
              @click="saveStatus"
            >
              حفظ حالة الطلب
            </button>
            <button
              class="px-4 py-2 rounded border"
              @click="selectedOrder = null"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axiosInstance from "@/api/axios";
import { fmtMoney, fmtDate } from "@/utils/format";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const myPermissions = computed<string[]>(() => {
  const p = auth.user?.permissions;
  return Array.isArray(p) ? (p as string[]) : [];
});
const canManageSalesInvoices = computed(
  () =>
    myPermissions.value.includes("فواتير المبيعات") ||
    myPermissions.value.includes("manage sales invoices") ||
    myPermissions.value.includes("manage orders"),
);

interface OrderItem {
  id: number;
  quantity: number;
  unit_price?: number;
  price?: number;
  line_total?: number;
  meta?: { name?: string };
  product?: { id: number; name: string };
}

interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  payment_method?: string;
  subtotal?: number;
  discount_total?: number;
  shipping_fee?: number;
  notes?: string;
  address_text?: string;
  merchant_notes?: string | null;
  customer?: { id: number; name: string; phone?: string };
  items?: OrderItem[];
  status_logs?: Array<{ status: string; note?: string; created_at: string }>;
  delivery_provider?: string | null;
  delivery_city_id?: number | null;
  delivery_city_name?: string | null;
  delivery_region_id?: number | null;
  delivery_region_name?: string | null;
  delivery_external_id?: string | null;
  delivery_error?: string | null;
  suspended_note?: string | null;
  suspended_at?: string | null;
  suspended_by_user_id?: number | null;
}

const orders = ref<Order[]>([]);
const page = ref(1);
const total = ref(0);
const perPage = ref(15);
const lastPage = ref(1);

// Date filter
const dateFrom = ref<string>("");
const dateTo = ref<string>("");

// Advanced filters
const statusFilter = ref<string>("");
const customerName = ref<string>("");
const customerPhone = ref<string>("");
const orderId = ref<string>("");
const vendorName = ref<string>("");

// Summary of all filtered orders (from backend)
const summary = ref<{
  count: number;
  subtotal_sum: number;
  discount_sum: number;
  shipping_sum: number;
  total_sum: number;
} | null>(null);

const selectedOrder = ref<Order | null>(null);
const statusDraft = ref<string>("");
const saving = ref(false);
// Delivery city/region are selected in employee app (saved on order).

const statuses = ["pending", "confirmed", "suspended", "shipped", "delivered", "cancelled"];

const suspendedNoteDraft = ref<string>("");
const deliveryBoys = ref<any[]>([]);
const fastBoyId = ref<number>(0);
const fastBusy = ref(false);

const whatsappTemplate = ref<string>("");

function normalizePhoneForWhatsApp(raw: any): string {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("964")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "964" + digits.slice(1);
  return digits;
}

function buildItemsText(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  return items
    .map((it) => {
      const name = it.product?.name || it.meta?.name || "—";
      const qty = it.quantity ?? 1;
      const unit = (it.unit_price ?? it.price ?? 0) as any;
      return `- ${name} x${qty} (${unit})`;
    })
    .join("\n");
}

function renderWhatsAppMessage(order: Order): string {
  const tpl = (whatsappTemplate.value || "").trim();
  const map: Record<string, string> = {
    order_id: String(order.id ?? ""),
    customer_name: String(order.customer?.name ?? ""),
    customer_phone: String(order.customer?.phone ?? ""),
    address: String(order.address_text ?? ""),
    city: String(order.delivery_city_name ?? order.delivery_city_id ?? ""),
    region: String(order.delivery_region_name ?? order.delivery_region_id ?? ""),
    total: String(order.total ?? ""),
    items: buildItemsText(order),
  };
  if (!tpl) {
    // Fallback if template not configured yet
    return [
      "السلام عليكم ورحمة الله وبركاته",
      "",
      "يرجى التفضّل بتأكيد معلومات الطلب المسجلة أدناه،",
      "وذلك لغرض المباشرة بتجهيز طلبكم من وكالة ناس:",
      `	•	الاسم: ${map.customer_name}`,
      `	•	رقم الهاتف: ${map.customer_phone}`,
      `	•	العنوان: ${map.address}`,
      `	•	المنتج: ${map.items}`,
      `	•	السعر: ${map.total} دينار`,
      "",
      "بعد تأكيدكم، سيتم تجهيز الطلب وإرساله خلال 24–48 ساعة،",
      "وسيتواصل معكم مندوب التوصيل قبل الوصول.",
      "",
      "شاكرين تعاونكم وثقتكم بـ وكالة ناس.",
      "",
      "مع فائق الاحترام",
      "قسم تنسيق الطلبات – وكالة ناس",
    ].join("\n");
  }
  return tpl.replace(/\{(\w+)\}/g, (_, key) => (map[key] ?? ""));
}

function openWhatsApp(order: Order) {
  const phone = normalizePhoneForWhatsApp(order.customer?.phone);
  if (!phone) {
    alert("لا يوجد رقم هاتف للزبون");
    return;
  }
  const msg = renderWhatsAppMessage(order);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
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
  total.value === 0 ? 0 : (page.value - 1) * perPage.value + 1
);
const toRecord = computed(() =>
  Math.min(page.value * perPage.value, total.value)
);

async function fetchOrders() {
  const res = await axiosInstance.get("cashier/orders", {
    params: {
      page: page.value,
      per_page: perPage.value,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
      status: statusFilter.value || undefined,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      order_id: orderId.value || undefined,
      vendor_name: vendorName.value || undefined,
    },
  });
  const payload = res.data;
  orders.value = payload.data ?? payload;
  total.value = payload.total ?? orders.value.length;
  perPage.value = payload.per_page ?? perPage.value;
  lastPage.value =
    payload.last_page ??
    (perPage.value > 0
      ? Math.max(1, Math.ceil(total.value / perPage.value))
      : 1);
  summary.value = payload.summary ?? null;
}

onMounted(fetchOrders);

onMounted(async () => {
  try {
    const res = await axiosInstance.get("v1/cashier/settings/whatsapp-template");
    whatsappTemplate.value = String(res.data?.whatsapp_template ?? "");
  } catch (_) {
    whatsappTemplate.value = "";
  }
});

watch(page, () => {
  fetchOrders();
});

async function openOrder(order: Order) {
  try {
    const res = await axiosInstance.get(`cashier/orders/${order.id}`);
    const full = res.data as Order;
    selectedOrder.value = full;
    statusDraft.value = full.status;
    suspendedNoteDraft.value = (full.suspended_note as any) || "";
    await loadDeliveryBoys();
    fastBoyId.value = 0;
  } catch (e) {
    console.error(e);
    alert("تعذر تحميل تفاصيل الطلب");
  }
}

async function loadDeliveryBoys() {
  try {
    const res = await axiosInstance.get("v1/cashier/fast-delivery/delivery-boys");
    deliveryBoys.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch {
    deliveryBoys.value = [];
  }
}

async function assignFast(convertFromModon: boolean) {
  if (!selectedOrder.value) return;
  fastBusy.value = true;
  try {
    const endpoint = convertFromModon
      ? `v1/cashier/orders/${selectedOrder.value.id}/fast/convert`
      : `v1/cashier/orders/${selectedOrder.value.id}/fast/assign`;
    const payload =
      fastBoyId.value && fastBoyId.value > 0
        ? { delivery_boy_id: fastBoyId.value }
        : { delivery_boy_id: null };
    const res = await axiosInstance.post(endpoint, payload);
    if (res.data?.order) {
      selectedOrder.value = res.data.order;
    } else {
      const full = await axiosInstance.get(`cashier/orders/${selectedOrder.value.id}`);
      selectedOrder.value = full.data;
    }
    alert(convertFromModon ? "تم تحويل الطلب إلى سريع." : "تم تعيين الطلب كمندوب سريع.");
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر تنفيذ العملية.");
  } finally {
    fastBusy.value = false;
  }
}

async function settleFast() {
  if (!selectedOrder.value) return;
  fastBusy.value = true;
  try {
    const res = await axiosInstance.post(
      `v1/cashier/orders/${selectedOrder.value.id}/fast/settle`,
    );
    if (res.data?.order) {
      selectedOrder.value = res.data.order;
    } else {
      const full = await axiosInstance.get(`cashier/orders/${selectedOrder.value.id}`);
      selectedOrder.value = full.data;
    }
    alert("تم تسجيل التسوية وإضافة عمولة المندوب (إن وجدت).");
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر تنفيذ التسوية.");
  } finally {
    fastBusy.value = false;
  }
}

async function saveStatus() {
  if (!selectedOrder.value) return;
  saving.value = true;
  try {
    const payload: any = { status: statusDraft.value };
    if (statusDraft.value === "confirmed") {
      // City/region must already be selected in the employee app.
      const provider = (selectedOrder.value as any)?.delivery_provider as
        | "modon"
        | "nass"
        | undefined
        | null;
      const requiresModonLocation = provider !== "nass"; // default/legacy => modon
      if (
        requiresModonLocation &&
        (!selectedOrder.value.delivery_city_id || !selectedOrder.value.delivery_region_id)
      ) {
        alert("لا يمكن تأكيد الطلب بدون مدينة/منطقة مودن. يرجى اختيارها من تطبيق الموظف أولاً.");
        saving.value = false;
        return;
      }
      // Do NOT send city/region again; backend will use what's stored on the order.
    }
    if (statusDraft.value === "suspended") {
      const note = (suspendedNoteDraft.value || "").trim();
      if (!note) {
        alert("يرجى كتابة ملاحظة عند جعل الطلب معلق");
        saving.value = false;
        return;
      }
      payload.suspended_note = note;
    }

    const res = await axiosInstance.post(`cashier/orders/${selectedOrder.value.id}/status`, payload);
    // Refresh order so delivery id/error shows
    if (res.data?.order) {
      selectedOrder.value = res.data.order;
    } else {
      const full = await axiosInstance.get(`cashier/orders/${selectedOrder.value.id}`);
      selectedOrder.value = full.data;
    }
    if (selectedOrder.value) {
      selectedOrder.value.status = statusDraft.value;
    }
    orders.value = orders.value.map((o) =>
      o.id === selectedOrder.value?.id ? { ...o, status: statusDraft.value } : o
    );
    alert("تم تحديث حالة الطلب");
  } catch (e) {
    console.error(e);
    alert("تعذر تحديث حالة الطلب أو إنشاء طلب التوصيل");
  } finally {
    saving.value = false;
  }
}
function applyFilter() {
  page.value = 1;
  fetchOrders();
}

function goToPage(target: number) {
  if (target < 1 || target > totalPages.value || target === page.value) return;
  page.value = target;
}

function changePerPage() {
  page.value = 1;
  fetchOrders();
}

</script>