<template>
  <div class="space-y-4">
    <div class="rounded-2xl border bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-extrabold">طلبات التوصيل السريع</h2>
          <p class="text-xs text-gray-500">
            الطلبات المخصصة لك (توصيل داخلي). يمكنك تعليم الطلب كمُسلّم وطباعة قائمة الطريق.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="statusFilter" class="border rounded-lg px-3 py-2 text-sm">
            <option value="open">غير مُسلّمة</option>
            <option value="delivered">مُسلّمة (بانتظار تسوية)</option>
            <option value="settled">مُسوّاة</option>
            <option value="all">الكل</option>
          </select>
          <button
            class="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            :disabled="loading"
            type="button"
            @click="fetchMyOrders"
          >
            تحديث
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
            :disabled="loading || !orders.length"
            type="button"
            @click="printList"
          >
            طباعة القائمة
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div v-if="error" class="p-4 text-sm text-red-600">
        {{ error }}
      </div>
      <div v-else-if="loading" class="p-6 text-center text-gray-500">
        جاري التحميل...
      </div>
      <div v-else>
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-right">
              <th class="p-3 border-b">رقم الطلب</th>
              <th class="p-3 border-b">الاسم</th>
              <th class="p-3 border-b">الهاتف</th>
              <th class="p-3 border-b">العنوان / أقرب نقطة</th>
              <th class="p-3 border-b">الحالة</th>
              <th class="p-3 border-b text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!orders.length">
              <td class="p-6 text-center text-gray-500" colspan="6">
                لا توجد طلبات.
              </td>
            </tr>
            <tr v-for="o in orders" :key="o.id" class="border-b">
              <td class="p-3 font-semibold ltr">{{ o.id }}</td>
              <td class="p-3">{{ o.customer?.name ?? "—" }}</td>
              <td class="p-3 ltr">{{ o.customer?.phone ?? "—" }}</td>
              <td class="p-3">{{ o.address_text ?? "—" }}</td>
              <td class="p-3">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-lg text-xs border"
                  :class="
                    o.fast_settled_at
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : o.fast_delivered_at
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                  "
                >
                  {{
                    o.fast_settled_at
                      ? "مُسوّى"
                      : o.fast_delivered_at
                        ? "مُسلّم"
                        : "قيد التوصيل"
                  }}
                </span>
              </td>
              <td class="p-3 text-center">
                <button
                  class="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
                  type="button"
                  :disabled="markingId === o.id || !!o.fast_delivered_at"
                  @click="markDelivered(o.id)"
                >
                  {{ markingId === o.id ? "جاري..." : "تم التسليم" }}
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
import { onMounted, ref, watch } from "vue";
import axiosInstance from "@/api/axios";

const loading = ref(false);
const error = ref("");
const orders = ref<any[]>([]);
const markingId = ref<number | null>(null);
const statusFilter = ref<"open" | "delivered" | "settled" | "all">("open");

async function fetchMyOrders() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axiosInstance.get("v1/cashier/fast-delivery/my-orders", {
      params: { status: statusFilter.value },
    });
    orders.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تحميل الطلبات.";
  } finally {
    loading.value = false;
  }
}

async function markDelivered(orderId: number) {
  markingId.value = orderId;
  try {
    await axiosInstance.post(`v1/cashier/orders/${orderId}/fast/mark-delivered`);
    await fetchMyOrders();
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر تحديث الطلب.");
  } finally {
    markingId.value = null;
  }
}

async function printList() {
  const url = new URL(window.location.origin);
  url.pathname = "/api/v1/cashier/fast-delivery/my-orders/print/html";
  url.searchParams.set("status", statusFilter.value);
  window.open(url.toString(), "_blank");
}

watch(statusFilter, () => fetchMyOrders());
onMounted(fetchMyOrders);
</script>

<style scoped>
.ltr {
  direction: ltr;
  text-align: left;
}
</style>

