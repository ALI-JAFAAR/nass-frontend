<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border p-4 md:p-5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              🚚
            </div>
            <div>
              <h2 class="font-semibold leading-tight">محفظة التوصيل</h2>
              <p class="text-[11px] text-gray-500">
                يتم احتساب التحصيل عند وصول حالة مودن إلى "تم تسليم الطلب الى الزبون".
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            :disabled="loading"
            @click="syncDelivered"
          >
            {{ syncing ? "جارِ المزامنة..." : "مزامنة (تم التسليم)" }}
          </button>
          <button
            class="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            :disabled="loading"
            @click="loadWallet"
          >
            {{ loading ? "..." : "تحديث" }}
          </button>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Balance -->
        <div class="rounded-xl border p-4 bg-gradient-to-br from-blue-50 to-white">
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500">الرصيد الحالي</div>
            <span
              class="text-[11px] px-2 py-0.5 rounded-full border"
              :class="(wallet?.balance ?? 0) > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'"
            >
              {{ (wallet?.balance ?? 0) > 0 ? "يوجد رصيد" : "لا يوجد رصيد" }}
            </span>
          </div>
          <div class="mt-2 text-2xl font-extrabold tracking-tight">
            {{ formatMoney(wallet?.balance ?? 0) }}
          </div>
          <p class="mt-2 text-[11px] text-gray-500">
            هذا الرصيد يمثل مبالغ التحصيل المتراكمة (COD) التي لم يتم تسويتها بعد.
          </p>
        </div>

        <!-- Settlement -->
        <div class="rounded-xl border p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-semibold">تسوية / استلام</div>
            <span class="text-[11px] text-gray-500">خصم من الرصيد</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div class="md:col-span-1">
              <label class="block text-[11px] text-gray-500 mb-1">المبلغ</label>
              <input
                v-model.number="settleAmount"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="مثال: 150000"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] text-gray-500 mb-1">ملاحظة (اختياري)</label>
              <input
                v-model="settleNote"
                class="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="استلام دفعة من شركة التوصيل"
              />
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <p class="text-[11px] text-gray-500">
              سيتم إنشاء حركة "تسوية" وتنقيص الرصيد.
            </p>
            <button
              class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
              :disabled="loading || !canSettle"
              @click="settle"
            >
              تسوية
            </button>
          </div>
        </div>

        <!-- Sync status -->
        <div class="rounded-xl border p-4 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold">حالة المزامنة</div>
            <span
              class="text-[11px] px-2 py-0.5 rounded-full border"
              :class="lastSyncMessage ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-100 border-gray-200 text-gray-500'"
            >
              {{ lastSyncMessage ? "آخر نتيجة" : "—" }}
            </span>
          </div>
          <div class="mt-2 text-sm font-semibold text-gray-800">
            {{ lastSyncMessage || "لم يتم تنفيذ مزامنة بعد." }}
          </div>
          <p class="mt-2 text-[11px] text-gray-500">
            استخدم "مزامنة (تم التسليم)" لتحديث حالات مودن وإضافة التحصيل للرصيد.
          </p>
        </div>
      </div>

      <div v-if="error" class="mt-3 text-sm rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
        {{ error }}
      </div>
    </div>

    <div class="bg-white rounded-xl border">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="space-y-0.5">
          <h3 class="font-semibold">الحركات</h3>
          <div class="text-[11px] text-gray-500">
            آخر {{ transactions.length }} حركة
          </div>
        </div>
        <button
          class="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
          :disabled="loading"
          @click="loadWallet"
        >
          تحديث الحركات
        </button>
      </div>
      <div class="p-4 overflow-auto">
        <table class="w-full text-sm min-w-[780px]">
          <thead>
            <tr class="text-gray-500 bg-gray-50">
              <th class="text-right p-2">التاريخ</th>
              <th class="text-right p-2">النوع</th>
              <th class="text-right p-2">المصدر</th>
              <th class="text-right p-2">المبلغ</th>
              <th class="text-right p-2">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in transactions"
              :key="t.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="p-2">{{ fmtDate(t.created_at) }}</td>
              <td class="p-2">
                <span v-if="t.direction === 'credit'" class="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  + تحصيل
                </span>
                <span v-else class="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  − تسوية
                </span>
              </td>
              <td class="p-2">
                <div class="text-gray-700 font-medium">
                  {{ t.source_type || "—" }}
                  <span v-if="t.source_id" class="text-gray-400">{{ t.source_id }}</span>
                </div>
              </td>
              <td class="p-2 font-semibold">
                {{ formatMoney(t.amount ?? 0) }}
              </td>
              <td class="p-2">{{ t.description || "—" }}</td>
            </tr>
            <tr v-if="!transactions.length">
              <td class="p-6 text-gray-500 text-center" colspan="5">
                لا توجد حركات حتى الآن.
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

const loading = ref(false);
const syncing = ref(false);
const error = ref("");
const lastSyncMessage = ref("");

const wallet = ref<{ id: number; balance: number } | null>(null);
const transactions = ref<any[]>([]);

const settleAmount = ref<number | null>(null);
const settleNote = ref("");

function formatMoney(v: number) {
  try {
    return new Intl.NumberFormat("ar-IQ").format(v) + " د.ع";
  } catch {
    return String(v) + " د.ع";
  }
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

const canSettle = computed(() => {
  const amount = typeof settleAmount.value === "number" ? settleAmount.value : 0;
  const bal = Number(wallet.value?.balance ?? 0);
  if (!amount || amount <= 0) return false;
  if (!Number.isFinite(bal)) return true;
  return amount <= bal;
});

async function loadWallet() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axiosInstance.get("v1/cashier/delivery/wallet", {
      params: { provider: "modon", limit: 100 },
    });
    wallet.value = res.data?.wallet ?? null;
    transactions.value = Array.isArray(res.data?.transactions)
      ? res.data.transactions
      : [];
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ||
      "تعذر تحميل محفظة التوصيل (تأكد من الصلاحيات/اختيار المحل).";
  } finally {
    loading.value = false;
  }
}

async function settle() {
  const amount = typeof settleAmount.value === "number" ? settleAmount.value : 0;
  if (!amount || amount <= 0) return;
  const bal = Number(wallet.value?.balance ?? 0);
  if (Number.isFinite(bal) && amount > bal) {
    error.value = "المبلغ أكبر من الرصيد الحالي.";
    return;
  }
  if (!confirm(`تأكيد تسوية مبلغ ${formatMoney(amount)} ؟`)) return;

  loading.value = true;
  error.value = "";
  try {
    await axiosInstance.post("v1/cashier/delivery/wallet/settle", {
      provider: "modon",
      amount,
      note: settleNote.value || null,
    });
    settleAmount.value = null;
    settleNote.value = "";
    await loadWallet();
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر تنفيذ التسوية.";
  } finally {
    loading.value = false;
  }
}

async function syncDelivered() {
  syncing.value = true;
  error.value = "";
  lastSyncMessage.value = "";
  try {
    const res = await axiosInstance.post(
      "v1/cashier/delivery/wallet/sync-delivered",
      null,
      { params: { limit: 500 } }
    );
    const stats = res.data?.stats;
    lastSyncMessage.value = stats
      ? `تم فحص ${stats.checked} - تم تسليم ${stats.delivered_marked} - تم تحصيل ${stats.wallet_credited}`
      : "تمت المزامنة";
    await loadWallet();
  } catch (e: any) {
    error.value = e?.response?.data?.message || "تعذر المزامنة.";
  } finally {
    syncing.value = false;
  }
}

onMounted(() => {
  loadWallet();
});
</script>

