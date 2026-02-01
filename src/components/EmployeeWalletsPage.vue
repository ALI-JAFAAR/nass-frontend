<template>
  <div class="bg-white rounded-lg border">
    <div class="px-4 py-3 flex items-center justify-between border-b">
      <div>
        <h2 class="font-semibold">محافظ الموظفين</h2>
        <p class="text-[11px] text-gray-500 mt-0.5">
          عرض الرصيد والعمولات لهذا الشهر، مع إمكانية فتح تفاصيل المحفظة والتسوية.
        </p>
      </div>
      <button
        class="px-4 py-2 rounded bg-blue-600 text-white text-sm"
        type="button"
        @click="fetchWallets"
      >
        تحديث
      </button>
    </div>

    <div class="p-4">
      <div class="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-4">
        <div v-if="isSuperAdmin" class="w-full md:w-1/3">
          <select
            v-model.number="selectedVendorId"
            class="w-full border rounded px-3 py-2"
            title="اختر المحل"
          >
            <option :value="0">اختر المحل (مطلوب)</option>
            <option v-for="v in vendors" :key="v.id" :value="v.id">
              {{ v.name }}
            </option>
          </select>
        </div>
        <input
          v-model="q"
          class="w-full md:w-1/2 border rounded px-3 py-2"
          placeholder="🔍 بحث بالاسم أو اسم المستخدم..."
          @input="debouncedFetch"
        />
        <div class="text-xs text-gray-500">
          الشهر الحالي: <span class="font-semibold">{{ monthLabel }}</span>
        </div>
      </div>

      <div v-if="pageError" class="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ pageError }}
      </div>

      <BaseTable
        :columns="columns"
        :items="items"
        :loading="loading"
        :search-columns="['name', 'username']"
        empty-text="لا توجد محافظ."
      >
        <template #cell-balance="{ item }">
          <span class="font-semibold">{{ item.wallet_balance ?? 0 }} د.ع</span>
        </template>

        <template #cell-earned="{ item }">
          <span class="font-semibold text-green-700">{{ item.earned_month ?? 0 }} د.ع</span>
        </template>

        <template #cell-commission="{ item }">
          <span v-if="item.commission_type === 'percent'">
            {{ item.commission_value ?? 0 }}%
          </span>
          <span v-else-if="item.commission_type === 'fixed'">
            {{ item.commission_value ?? 0 }} د.ع / طلب
          </span>
          <span v-else>—</span>
        </template>

        <template #cell-actions="{ item }">
          <button class="px-3 py-1 border rounded text-xs" type="button" @click="openWallet(item)">
            فتح
          </button>
        </template>
      </BaseTable>
    </div>

    <!-- Wallet Dialog (reused) -->
    <div
      v-if="isWalletDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeWalletDialog"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6" dir="rtl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">
              محفظة الموظف
              <span class="text-gray-500 text-sm font-normal">
                — {{ walletUser?.name ?? "" }} ({{ walletUser?.username ?? "" }})
              </span>
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              Credits = عمولة من الطلبات. Debits = تسوية/صرف.
            </p>
          </div>
          <button class="text-gray-400 hover:text-gray-700 text-xl" type="button" @click="closeWalletDialog">
            ×
          </button>
        </div>

        <div v-if="walletLoading" class="mt-6 text-center text-gray-500">
          جاري التحميل...
        </div>
        <div v-else class="mt-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl border p-4 bg-gray-50">
              <p class="text-xs text-gray-500">الرصيد الحالي</p>
              <p class="text-lg font-semibold mt-1">{{ walletData?.wallet?.balance ?? 0 }} د.ع</p>
            </div>
            <div class="rounded-xl border p-4 bg-gray-50">
              <p class="text-xs text-gray-500">الراتب</p>
              <p class="text-lg font-semibold mt-1">{{ walletData?.user?.salary ?? "—" }}</p>
            </div>
            <div class="rounded-xl border p-4 bg-gray-50">
              <p class="text-xs text-gray-500">نوع العمولة</p>
              <p class="text-sm font-semibold mt-2">
                <span v-if="walletData?.user?.commission_type === 'percent'">
                  نسبة ({{ walletData?.user?.commission_value ?? 0 }}%)
                </span>
                <span v-else-if="walletData?.user?.commission_type === 'fixed'">
                  مبلغ ثابت ({{ walletData?.user?.commission_value ?? 0 }} د.ع / طلب)
                </span>
                <span v-else>بدون عمولة</span>
              </p>
            </div>
          </div>

          <div class="rounded-xl border p-4">
            <div class="flex items-center justify-between">
              <p class="font-semibold">تسوية / صرف</p>
              <p class="text-xs text-gray-500">لا يمكن تسوية مبلغ أكبر من الرصيد</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input
                v-model.number="settleAmount"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="المبلغ"
              />
              <input
                v-model="settleNote"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="ملاحظة (اختياري)"
              />
              <button
                class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                :disabled="settleSubmitting || !settleAmount || settleAmount <= 0"
                type="button"
                @click="submitSettlement"
              >
                {{ settleSubmitting ? "جاري..." : "تسجيل التسوية" }}
              </button>
            </div>
            <p v-if="walletError" class="text-xs text-red-600 mt-2">{{ walletError }}</p>
          </div>

          <div class="rounded-xl border">
            <div class="px-4 py-3 border-b flex items-center justify-between">
              <p class="font-semibold">الحركات</p>
              <div class="flex items-center gap-2">
                <button class="text-xs px-3 py-1 rounded border" type="button" @click="exportSettlementsCsv">
                  تصدير التسويات (Excel)
                </button>
                <button class="text-xs px-3 py-1 rounded border" type="button" @click="recalculateWallet">
                  إعادة احتساب (هذا الشهر)
                </button>
                <button class="text-xs px-3 py-1 rounded border" type="button" @click="reloadWallet">
                  تحديث
                </button>
              </div>
            </div>
            <div class="max-h-[340px] overflow-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr class="text-right">
                    <th class="p-3 border-b">#</th>
                    <th class="p-3 border-b">النوع</th>
                    <th class="p-3 border-b">المبلغ</th>
                    <th class="p-3 border-b">المصدر</th>
                    <th class="p-3 border-b">الوصف</th>
                    <th class="p-3 border-b">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!walletData?.transactions?.length">
                    <td class="p-4 text-center text-gray-500" colspan="6">لا توجد حركات</td>
                  </tr>
                  <tr v-for="t in walletData?.transactions ?? []" :key="t.id" class="border-b">
                    <td class="p-3">{{ t.id }}</td>
                    <td class="p-3">
                      <span
                        class="px-2 py-1 rounded text-xs"
                        :class="t.direction === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                      >
                        {{ t.direction === "credit" ? "إضافة" : "صرف" }}
                      </span>
                    </td>
                    <td class="p-3 font-semibold">{{ t.amount }} د.ع</td>
                    <td class="p-3">
                      <span v-if="t.source_type === 'pos_order'">طلب #{{ t.source_id }}</span>
                      <span v-else-if="t.source_type === 'settlement'">تسوية</span>
                      <span v-else>{{ t.source_type ?? "—" }}</span>
                    </td>
                    <td class="p-3">{{ t.description ?? "—" }}</td>
                    <td class="p-3">{{ (t.created_at ?? "").slice(0, 19).replace("T", " ") }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";
import { downloadCsv } from "@/utils/csv";

const auth = useAuthStore();
const isSuperAdmin = computed(() => !auth.user?.vendor_id);

const vendors = ref<any[]>([]);
const selectedVendorId = ref<number>(Number(localStorage.getItem("vendor_id") || 0));

const q = ref("");
const loading = ref(false);
const monthLabel = ref<string>("—");
const items = ref<any[]>([]);
const pageError = ref<string>("");

const columns = computed<BaseTableColumn[]>(() => [
  { key: "name", label: "الاسم" },
  { key: "username", label: "اسم المستخدم" },
  { key: "orders_month", label: "طلبات هذا الشهر" },
  { key: "earned", label: "مستحقات هذا الشهر" },
  { key: "balance", label: "الرصيد" },
  { key: "commission", label: "العمولة" },
  { key: "actions", label: "إجراءات", headerClass: "text-center", cellClass: "text-center" },
]);

let debounceTimer: any = null;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchWallets(), 250);
}

async function fetchWallets() {
  loading.value = true;
  pageError.value = "";
  try {
    if (isSuperAdmin.value) {
      const vid = Number(selectedVendorId.value || 0);
      if (!vid) {
        items.value = [];
        monthLabel.value = "—";
        pageError.value = "يجب اختيار المحل أولاً (Vendor context is required).";
        return;
      }
    }
    const endpoint = isSuperAdmin.value ? "v1/admin/employee-wallets" : "v1/vendor/employee-wallets";
    const res = await axiosInstance.get(endpoint, { params: q.value ? { q: q.value } : undefined });
    monthLabel.value = res.data?.month ?? "—";
    items.value = Array.isArray(res.data?.data) ? res.data.data : [];
    // Normalize keys to match BaseTable slots
    items.value = items.value.map((it: any) => ({
      ...it,
      earned: it.earned_month ?? 0,
      balance: it.wallet_balance ?? 0,
    }));
  } catch (e: any) {
    pageError.value =
      e?.response?.data?.message ||
      "تعذر تحميل محافظ الموظفين (تأكد من اختيار المحل للمشرف العام).";
  } finally {
    loading.value = false;
  }
}

// Wallet dialog (same behavior as UsersPage)
const isWalletDialogOpen = ref(false);
const walletLoading = ref(false);
const walletUser = ref<any | null>(null);
const walletData = ref<any | null>(null);
const settleAmount = ref<number | null>(null);
const settleNote = ref("");
const settleSubmitting = ref(false);
const walletError = ref<string>("");

function walletEndpointForUser(userId: number): string {
  const base = isSuperAdmin.value ? "v1/admin/users" : "v1/vendor/users";
  return `${base}/${userId}/wallet`;
}

async function openWallet(u: any) {
  walletUser.value = u;
  isWalletDialogOpen.value = true;
  settleAmount.value = null;
  settleNote.value = "";
  walletError.value = "";
  await reloadWallet();
}

function closeWalletDialog() {
  isWalletDialogOpen.value = false;
  walletUser.value = null;
  walletData.value = null;
  walletLoading.value = false;
  settleSubmitting.value = false;
  walletError.value = "";
}

async function reloadWallet() {
  const u = walletUser.value;
  if (!u?.id) return;
  walletLoading.value = true;
  walletError.value = "";
  try {
    const res = await axiosInstance.get(walletEndpointForUser(u.id));
    walletData.value = res.data;
  } finally {
    walletLoading.value = false;
  }
}

async function submitSettlement() {
  const u = walletUser.value;
  if (!u?.id) return;
  const amount = typeof settleAmount.value === "number" ? settleAmount.value : 0;
  if (!amount || amount <= 0) return;

  settleSubmitting.value = true;
  walletError.value = "";
  try {
    const endpoint = walletEndpointForUser(u.id) + "/settle";
    await axiosInstance.post(endpoint, { amount, note: settleNote.value || null });
    settleAmount.value = null;
    settleNote.value = "";
    await reloadWallet();
    await fetchWallets();
  } catch (e: any) {
    walletError.value = e?.response?.data?.message || "تعذر تسجيل التسوية";
  } finally {
    settleSubmitting.value = false;
  }
}

async function recalculateWallet() {
  const u = walletUser.value;
  if (!u?.id) return;
  walletLoading.value = true;
  walletError.value = "";
  try {
    const endpoint = walletEndpointForUser(u.id) + "/recalculate";
    await axiosInstance.post(endpoint, {});
    await reloadWallet();
    await fetchWallets();
  } catch (e: any) {
    walletError.value = e?.response?.data?.message || "تعذر إعادة الاحتساب";
  } finally {
    walletLoading.value = false;
  }
}

function exportSettlementsCsv() {
  const u = walletUser.value;
  const tx = Array.isArray(walletData.value?.transactions)
    ? walletData.value.transactions
    : [];
  const rows = tx
    .filter((t: any) => t.direction === "debit" && t.source_type === "settlement")
    .map((t: any) => ({
      employee: u?.name ?? "",
      username: u?.username ?? "",
      date: (t.created_at ?? "").slice(0, 19).replace("T", " "),
      amount: t.amount ?? 0,
      note: t.description ?? "",
    }));

  if (!rows.length) {
    walletError.value = "لا توجد تسويات لتصديرها.";
    return;
  }
  downloadCsv(
    rows,
    ["الموظف", "اسم المستخدم", "التاريخ", "المبلغ", "الملاحظة"],
    `settlements_${u?.username ?? "employee"}.csv`
  );
}

fetchWallets();

async function fetchVendors() {
  if (!isSuperAdmin.value) return;
  try {
    const res = await axiosInstance.get("v1/admin/vendors");
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    vendors.value = Array.isArray(list) ? list : [];
  } catch (_) {
    vendors.value = [];
  }
}

// Persist selected vendor for super admin so axios can send X-Vendor-Id too.
watch(
  () => selectedVendorId.value,
  async (val) => {
    if (!isSuperAdmin.value) return;
    const v = Number(val || 0);
    if (v > 0) {
      localStorage.setItem("vendor_id", String(v));
      axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(v);
      await fetchWallets();
    } else {
      localStorage.removeItem("vendor_id");
      delete axiosInstance.defaults.headers.common["X-Vendor-Id"];
      items.value = [];
      monthLabel.value = "—";
      pageError.value = "يجب اختيار المحل أولاً (Vendor context is required).";
    }
  },
);

onMounted(async () => {
  await fetchVendors();
  if (isSuperAdmin.value && Number(selectedVendorId.value || 0) > 0) {
    axiosInstance.defaults.headers.common["X-Vendor-Id"] = String(selectedVendorId.value);
  }
  await fetchWallets();
});
</script>

