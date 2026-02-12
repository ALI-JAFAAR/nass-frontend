<template>
  <div class="space-y-8">
    <!-- Users Section -->
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center border-b">
        <h2 class="font-semibold">إدارة المستخدمين</h2>
        <button
          class="px-4 py-2 rounded bg-blue-600 text-white"
          @click="openUserDialogForNew"
        >
          إضافة مستخدم
        </button>
      </div>
      <div class="p-4">
        <div class="flex justify-between mb-4 gap-2">
          <input
            v-model="searchUser"
            placeholder="🔍 ابحث بالاسم أو اسم المستخدم"
            class="w-1/2 border rounded px-3 py-2"
          />
          <!-- CSV export left as simple JSON download to avoid react-csv -->
          <button
            class="px-4 py-2 rounded bg-green-600 text-white"
            type="button"
            @click="downloadUsersCsv"
          >
            تصدير CSV
          </button>
        </div>

        <BaseTable
          :columns="userTableColumns"
          :items="paginatedUsers"
          :loading="loadingUsers"
          :search-columns="['name', 'username', 'vendor', 'role']"
          empty-text="لا توجد مستخدمين."
        >
          <template #cell-index="{ index }">
            {{ (userPage - 1) * perPage + index + 1 }}
          </template>

          <template #cell-name="{ item }">
            {{ item.name }}
          </template>

          <template #cell-username="{ item }">
            {{ item.username }}
          </template>

          <template #cell-vendor="{ item }">
            {{ item.vendors?.[0]?.name ?? "" }}
          </template>

          <template #cell-role="{ item }">
            {{ getRoleNames(item).join(", ") }}
          </template>

          <template #cell-salary="{ item }">
            <span v-if="isSalaryUser(item)">
              {{ item.salary ?? "—" }}
            </span>
            <span v-else>—</span>
          </template>

          <template #cell-commission="{ item }">
            <template v-if="isCommissionUser(item)">
              <span v-if="item.commission_type === 'percent'">
                {{ item.commission_value ?? 0 }}%
              </span>
              <span v-else-if="item.commission_type === 'fixed'">
                {{ item.commission_value ?? 0 }} د.ع / طلب
              </span>
              <span v-else>—</span>
            </template>
            <span v-else>—</span>
          </template>

          <template #cell-actions="{ item }">
            <button
              v-if="isEmployeeUser(item)"
              class="px-3 py-1 border rounded text-xs"
              @click="openWalletDialog(item)"
            >
              محفظة
            </button>
            <button
              class="px-3 py-1 border rounded text-xs"
              @click="openUserDialogForEdit(item)"
            >
              تعديل
            </button>
            <button
              class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
              @click="handleDeleteUser(item.id)"
            >
              حذف
            </button>
          </template>
        </BaseTable>

        <div class="flex justify-end gap-2 mt-4">
          <button
            v-for="pageNum in userTotalPages"
            :key="pageNum"
            class="px-3 py-1 rounded border text-sm"
            :class="userPage === pageNum ? 'bg-blue-600 text-white' : ''"
            @click="userPage = pageNum"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>

    <!-- Roles Section -->
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center border-b">
        <h2 class="font-semibold">إدارة الأدوار</h2>
        <button
          class="px-4 py-2 rounded bg-blue-600 text-white"
          @click="openRoleDialogForNew"
        >
          إضافة دور
        </button>
      </div>
      <div class="p-4">
        <div class="flex justify-between mb-4 gap-2">
          <input
            v-model="rolesSearch"
            placeholder="🔍 ابحث عن دور..."
            class="w-1/2 border rounded px-3 py-2"
          />
          <button
            class="px-4 py-2 rounded bg-green-600 text-white"
            type="button"
            @click="downloadRolesCsv"
          >
            تصدير CSV
          </button>
        </div>

        <BaseTable
          :columns="roleTableColumns"
          :items="paginatedRoles"
          :loading="loadingRoles"
          :search-columns="['name', 'permissions']"
          empty-text="لا توجد أدوار."
        >
          <template #cell-index="{ index }">
            {{ (rolesPage - 1) * perPage + index + 1 }}
          </template>

          <template #cell-name="{ item }">
            {{ item.name }}
          </template>

          <template #cell-permissions="{ item }">
            <span class="max-w-[250px] truncate block">
              {{ item.permissions.map((p:any) => p.name).join(", ") }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <button
              class="px-3 py-1 border rounded text-xs"
              @click="openRoleDialogForEdit(item)"
            >
              تعديل
            </button>
            <button
              class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
              @click="handleDeleteRole(item.id)"
            >
              حذف
            </button>
          </template>
        </BaseTable>

        <div class="flex justify-end gap-2 mt-4">
          <button
            v-for="pageNum in rolesTotalPages"
            :key="pageNum"
            class="px-3 py-1 rounded border text-sm"
            :class="rolesPage === pageNum ? 'bg-blue-600 text-white' : ''"
            @click="rolesPage = pageNum"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>

    <!-- User Dialog -->
    <div
      v-if="isUserDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isUserDialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingUser ? "تعديل مستخدم" : "إضافة مستخدم" }}
        </h3>
        <form class="space-y-3" @submit.prevent="handleUserSubmit">
          <label class="text-sm">الاسم</label>
          <input
            v-model="userForm.name"
            class="w-full border rounded px-3 py-2"
          />
          <label class="text-sm">اسم المستخدم</label>
          <input
            v-model="userForm.username"
            class="w-full border rounded px-3 py-2"
          />
          <label class="text-sm">كلمة المرور</label>
          <input
            v-model="userForm.password"
            type="password"
            class="w-full border rounded px-3 py-2"
          />
          <label class="text-sm">الدور</label>
          <select
            v-model="userForm.role"
            class="w-full border rounded px-3 py-2"
          >
            <option v-for="r in roles" :key="r.name">
              {{ r.name }}
            </option>
          </select>

          <!-- Employee / Preparation compensation -->
          <div v-if="isEmployeeRole || isPreparationRole" class="rounded-lg border bg-gray-50 p-3 space-y-3">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-sm">إعدادات الموظف</p>
              <p v-if="isPreparationRole" class="text-[11px] text-gray-500">الراتب فقط (بدون عمولة)</p>
              <p v-else class="text-[11px] text-gray-500">الراتب + عمولة (نسبة أو مبلغ ثابت)</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-sm">الراتب</label>
                <input
                  v-model.number="userForm.salary"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border rounded px-3 py-2"
                  placeholder="مثال: 500000"
                />
              </div>

              <div v-if="isEmployeeRole" class="space-y-1">
                  <label class="text-sm">نوع العمولة</label>
                  <select
                    v-model="userForm.commission_type"
                    class="w-full border rounded px-3 py-2"
                  >
                    <option value="">بدون عمولة</option>
                    <option value="percent">نسبة % من إجمالي الطلبات</option>
                    <option value="fixed">مبلغ ثابت لكل طلب</option>
                  </select>
                </div>
            </div>

            <div v-if="isEmployeeRole && userForm.commission_type" class="space-y-1">
              <label class="text-sm">
                قيمة العمولة
                <span v-if="userForm.commission_type === 'percent'">(٪)</span>
                <span v-else>(د.ع)</span>
              </label>
              <input
                v-model.number="userForm.commission_value"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded px-3 py-2"
                :placeholder="userForm.commission_type === 'percent' ? 'مثال: 5' : 'مثال: 1000'"
              />
              <p class="text-[11px] text-gray-500">
                يمكنك لاحقاً حساب مستحقات الموظف من التقارير حسب مجموع الطلبات.
              </p>
            </div>
          </div>
          <div v-if="userForm.role !== 'admin'">
            <label class="text-sm">المتجر</label>
            <select
              v-model="userForm.shop_id"
              class="w-full border rounded px-3 py-2"
            >
              <option value="">اختر متجرًا</option>
              <option v-for="shop in allShops" :key="shop.id" :value="shop.id">
                {{ shop.name }}
              </option>
            </select>
          </div>
          <button
            type="submit"
            class="w-full px-4 py-2 rounded bg-green-600 text-white mt-2"
          >
            {{ editingUser ? "تحديث" : "إضافة" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Role Dialog -->
    <div
      v-if="isRoleDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isRoleDialogOpen = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 app-panel app-border"
        dir="rtl"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold app-text">
              {{ editingRole ? "تعديل الدور" : "إضافة دور جديد" }}
            </h3>
            <p class="text-xs text-gray-500 app-text-muted mt-1">
              اختر الاسم المناسب للدور ثم فعّل الصلاحيات المطلوبة من القائمة أدناه.
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-700 text-xl"
            type="button"
            @click="isRoleDialogOpen = false"
          >
            ×
          </button>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <!-- Left: basic role info -->
          <div class="md:col-span-1 space-y-3">
            <label class="text-xs font-medium app-text-muted">اسم الدور</label>
            <input
              v-model="roleName"
              class="w-full border rounded-lg px-3 py-2 text-sm app-border"
              placeholder="مثال: admin"
            />
            <p class="text-[11px] text-gray-500 app-text-muted leading-relaxed">
              يفضّل استخدام أسماء واضحة مثل
              <span class="font-semibold">admin</span> أو
              <span class="font-semibold">cashier</span>
              حتى يكون من السهل فهم صلاحيات كل دور.
            </p>
          </div>

          <!-- Right: permissions grid -->
          <div class="md:col-span-2 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium app-text-muted">
                الصلاحيات المرتبطة بالدور
              </label>
              <span class="text-[11px] text-gray-500 app-text-muted">
                {{ rolePerms.length }} صلاحية محددة
              </span>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1"
            >
              <label
                v-for="perm in permissions"
                :key="perm.id"
                class="flex items-start gap-2 text-xs sm:text-sm rounded-xl border app-border bg-white/90 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors min-h-[3.5rem]"
              >
                <input
                  type="checkbox"
                  class="shrink-0 rounded border-gray-300"
                  :checked="rolePerms.includes(perm.name)"
                  @change="onRolePermChange(perm.name, $event)"
                />
                <span class="app-text whitespace-normal break-words leading-snug">
                  {{ perm.name }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-lg border app-border text-gray-700 hover:bg-gray-50 app-text"
            @click="isRoleDialogOpen = false"
          >
            إلغاء
          </button>
          <button
            type="button"
            class="px-5 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm"
            @click="handleRoleSubmit"
          >
            {{ editingRole ? "تحديث الدور" : "حفظ الدور" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Wallet Dialog -->
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
              هنا يتم تسجيل عمولات الطلبات كحركات (Credits). عند التسوية يتم إنشاء حركة (Debit).
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
              <p class="text-lg font-semibold mt-1">
                {{ walletData?.wallet?.balance ?? 0 }} د.ع
              </p>
            </div>
            <div class="rounded-xl border p-4 bg-gray-50">
              <p class="text-xs text-gray-500">الراتب</p>
              <p class="text-lg font-semibold mt-1">
                {{ walletData?.user?.salary ?? "—" }}
              </p>
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
              <p class="text-xs text-gray-500">سيتم إنشاء حركة Debit وتخفيض الرصيد</p>
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
                    <td class="p-3 font-semibold">
                      {{ t.amount }} د.ع
                    </td>
                    <td class="p-3">
                      <span v-if="t.source_type === 'pos_order'">طلب {{ t.source_id }}</span>
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
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";
import { downloadCsv } from "@/utils/csv";

const auth = useAuthStore();
const isSuperAdmin = computed(() => !auth.user?.vendor_id);

const perPage = 5;

const searchUser = ref("");
const userPage = ref(1);
const users = ref<any[]>([]);
const loadingUsers = ref(false);

const permissions = ref<any[]>([]);
const roles = ref<any[]>([]);
const loadingRoles = ref(false);
const publicPermissions = ref<any[]>([]);

const permissionsSearch = ref("");
const permissionsPage = ref(1);

const rolesSearch = ref("");
const rolesPage = ref(1);

const allShops = ref<any[]>([]);

const isUserDialogOpen = ref(false);
const editingUser = ref<any | null>(null);
const userForm = ref({
  name: "",
  username: "",
  password: "",
  role: "",
  shop_id: "",
  salary: null as number | null,
  commission_type: "" as "" | "percent" | "fixed",
  commission_value: null as number | null,
});

const isEmployeeRole = computed(() => {
  const r = (userForm.value.role || "").toString().trim().toLowerCase();
  // Employee-like roles that can have salary + commission
  return r === "employee" || r === "delivery_boy";
});

const isPreparationRole = computed(() => {
  const r = (userForm.value.role || "").toString().trim().toLowerCase();
  return r === "preparation";
});

function getRoleNames(u: any): string[] {
  const names: string[] = [];
  if (typeof u?.role === "string" && u.role.trim()) names.push(u.role.trim());
  if (Array.isArray(u?.roles)) {
    for (const r of u.roles) {
      const n = (r?.name ?? "").toString().trim();
      if (n) names.push(n);
    }
  }
  // unique
  return Array.from(new Set(names));
}

function isSalaryUser(u: any): boolean {
  const byRole = getRoleNames(u).some((n) => {
    const rn = n.toLowerCase();
    return rn === "employee" || rn === "delivery_boy" || rn === "preparation";
  });
  // Fallback: some APIs may not return roles (team-scoped roles), but the
  // compensation fields are still returned and should display.
  const hasComp =
    u?.salary !== null && u?.salary !== undefined
      ? true
      : (u?.commission_type ?? "") !== "" ||
        (u?.commission_value !== null && u?.commission_value !== undefined);
  return byRole || hasComp;
}

function isCommissionUser(u: any): boolean {
  // Commission is for employee/delivery_boy (preparation is salary-only)
  return getRoleNames(u).some((n) => {
    const rn = n.toLowerCase();
    return rn === "employee" || rn === "delivery_boy";
  });
}

function isEmployeeUser(u: any): boolean {
  // Used for employee-only UI actions (wallet, etc.)
  const byRole = getRoleNames(u).some((n) => {
    const rn = n.toLowerCase();
    return rn === "employee" || rn === "delivery_boy";
  });
  const hasCommission =
    (u?.commission_type ?? "") !== "" ||
    (u?.commission_value !== null && u?.commission_value !== undefined);
  const hasSalary = u?.salary !== null && u?.salary !== undefined;
  return byRole || hasSalary || hasCommission;
}

const isPermDialogOpen = ref(false); // kept for parity, not used in UI
const editingPerm = ref<any | null>(null);
const permName = ref("");

const isRoleDialogOpen = ref(false);
const editingRole = ref<any | null>(null);
const roleName = ref("");
const rolePerms = ref<string[]>([]);

// Wallet dialog state (for employee settlement)
const isWalletDialogOpen = ref(false);
const walletLoading = ref(false);
const walletUser = ref<any | null>(null);
const walletData = ref<any | null>(null);
const settleAmount = ref<number | null>(null);
const settleNote = ref("");
const settleSubmitting = ref(false);
const walletError = ref<string>("");

onMounted(() => {
  fetchUsers();
  fetchRoles();
  fetchPermissions();
  fetchShops();
});

async function fetchShops() {
  try {
    if (isSuperAdmin.value) {
      // Super admin: load all vendors (shops) from admin API
      const res = await axiosInstance.get("v1/admin/vendors");
      const data = (res.data && res.data.data) || res.data;
      allShops.value = Array.isArray(data) ? data : [];
    } else if (auth.user?.vendor_id) {
      // Vendor admin: only their own shop; label is generic
      allShops.value = [
        {
          id: auth.user.vendor_id,
          name: "المتجر الحالي",
        },
      ];
    } else {
      allShops.value = [];
    }
  } catch (e) {
    console.error("Failed to load shops", e);
    allShops.value = [];
  }
}

async function fetchUsers() {
  loadingUsers.value = true;
  try {
    const endpoint = isSuperAdmin.value ? "v1/admin/users" : "v1/vendor/users";
    const res = await axiosInstance.get(endpoint);
    const data = (res.data && res.data.data) || res.data;
    users.value = Array.isArray(data) ? data : [];
  } finally {
    loadingUsers.value = false;
  }
}

function walletEndpointForUser(userId: number): string {
  const base = isSuperAdmin.value ? "v1/admin/users" : "v1/vendor/users";
  return `${base}/${userId}/wallet`;
}

async function openWalletDialog(u: any) {
  walletUser.value = u;
  isWalletDialogOpen.value = true;
  settleAmount.value = null;
  settleNote.value = "";
  await reloadWallet();
}

function closeWalletDialog() {
  isWalletDialogOpen.value = false;
  walletUser.value = null;
  walletData.value = null;
  walletLoading.value = false;
  settleSubmitting.value = false;
}

async function reloadWallet() {
  const u = walletUser.value;
  if (!u?.id) return;
  walletLoading.value = true;
  walletError.value = "";
  try {
    const res = await axiosInstance.get(walletEndpointForUser(u.id));
    walletData.value = res.data;
  } catch (e: any) {
    walletError.value =
      e?.response?.data?.message ||
      "تعذر تحميل المحفظة (تأكد من الصلاحيات/اختيار المحل).";
  } finally {
    walletLoading.value = false;
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
    await fetchUsers();
  } catch (e: any) {
    walletError.value = e?.response?.data?.message || "تعذر إعادة الاحتساب";
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
  try {
    const endpoint = walletEndpointForUser(u.id) + "/settle";
    await axiosInstance.post(endpoint, { amount, note: settleNote.value || null });
    settleAmount.value = null;
    settleNote.value = "";
    await reloadWallet();
  } finally {
    settleSubmitting.value = false;
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

async function fetchRoles() {
  loadingRoles.value = true;
  try {
    const endpoint = isSuperAdmin.value ? "v1/admin/roles" : "v1/vendor/roles";
    const res = await axiosInstance.get(endpoint);
    const data = (res.data && res.data.data) || res.data;
    roles.value = Array.isArray(data) ? data : [];
  } finally {
    loadingRoles.value = false;
  }
}

async function fetchPermissions() {
  const base = isSuperAdmin.value ? "v1/admin/permissions" : "v1/vendor/permissions";
  const [allRes, publicRes] = await Promise.all([
    axiosInstance.get(base),
    axiosInstance.get(base, { params: { scope: "public" } }),
  ]);
  const allData = (allRes.data && allRes.data.data) || allRes.data;
  const publicData = (publicRes.data && publicRes.data.data) || publicRes.data;
  permissions.value = Array.isArray(allData) ? allData : [];
  publicPermissions.value = Array.isArray(publicData) ? publicData : [];
}

const filteredUsers = computed(() =>
  users.value.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.value.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.value.toLowerCase())
  )
);

const paginatedUsers = computed(() =>
  filteredUsers.value.slice(
    (userPage.value - 1) * perPage,
    userPage.value * perPage
  )
);

const userTotalPages = computed(() =>
  Math.ceil(filteredUsers.value.length / perPage)
);

async function handleUserSubmit() {
  const base = isSuperAdmin.value ? "v1/admin/users" : "v1/vendor/users";

  // Keep payload minimal and compatible with both admin/vendor controllers.
  const payload: any = {
    name: userForm.value.name,
    username: userForm.value.username,
    role: userForm.value.role,
  };

  if (userForm.value.password) payload.password = userForm.value.password;

  // Compensation fields
  if (isEmployeeRole.value || isPreparationRole.value) {
    // Salary is required for preparation role
    if (isPreparationRole.value) {
      const s =
        typeof userForm.value.salary === "number" ? userForm.value.salary : null;
      if (s === null) {
        alert("الراتب مطلوب لدور preparation");
        return;
      }
    }

    payload.salary =
      typeof userForm.value.salary === "number" ? userForm.value.salary : null;
    if (isEmployeeRole.value) {
      payload.commission_type = userForm.value.commission_type || null;
      payload.commission_value =
        userForm.value.commission_type &&
        typeof userForm.value.commission_value === "number"
          ? userForm.value.commission_value
          : null;
    } else {
      // preparation: salary only
      payload.commission_type = null;
      payload.commission_value = null;
    }
  } else {
    // Clear if role is not employee
    payload.salary = null;
    payload.commission_type = null;
    payload.commission_value = null;
  }

  // Super admin can choose a shop explicitly from the UI.
  if (isSuperAdmin.value && userForm.value.shop_id) {
    const shopId = Number(userForm.value.shop_id);
    if (shopId > 0) {
      payload.shop_id = shopId;
      payload.vendor_id = shopId;
      payload.vendor_ids = [shopId];
    }
  }

  if (editingUser.value) {
    await axiosInstance.put(`${base}/${editingUser.value.id}`, payload);
  } else {
    await axiosInstance.post(base, payload);
  }
  isUserDialogOpen.value = false;
  userForm.value = {
    name: "",
    username: "",
    password: "",
    role: roles.value[0]?.name || "",
    shop_id: "",
    salary: null,
    commission_type: "",
    commission_value: null,
  };
  editingUser.value = null;
  fetchUsers();
}

async function handleDeleteUser(id: number) {
  if (confirm("هل أنت متأكد من حذف المستخدم؟")) {
    await axiosInstance.delete(`v1/vendor/users/${id}`);
    fetchUsers();
  }
}

function openUserDialogForNew() {
  editingUser.value = null;
  userForm.value = {
    name: "",
    username: "",
    password: "",
    role: roles.value[0]?.name || "",
    shop_id: "",
    salary: null,
    commission_type: "",
    commission_value: null,
  };
  isUserDialogOpen.value = true;
}

function openUserDialogForEdit(u: any) {
  editingUser.value = u;
  const resolvedShopId =
    (isSuperAdmin.value ? u.vendors?.[0]?.id : null) ?? u.shop_id ?? "";
  const roleNames = getRoleNames(u);
  const resolvedRole =
    (typeof u.role === "string" && u.role.trim()
      ? u.role.trim()
      : roleNames.find((r) => r.toLowerCase() === "employee") ?? roleNames[0] ?? "");
  userForm.value = {
    name: u.name,
    username: u.username,
    password: "",
    role: resolvedRole,
    shop_id: resolvedShopId,
    salary: typeof u.salary === "number" ? u.salary : (u.salary ? Number(u.salary) : null),
    commission_type:
      (resolvedRole || "").toString().trim().toLowerCase() === "preparation"
        ? ""
        : (u.commission_type ?? ""),
    commission_value:
      (resolvedRole || "").toString().trim().toLowerCase() === "preparation"
        ? null
        : (typeof u.commission_value === "number"
            ? u.commission_value
            : (u.commission_value ? Number(u.commission_value) : null)),
  };
  isUserDialogOpen.value = true;
}

function handlePermissionSubmit() {
  alert("إدارة الصلاحيات تتم من لوحة التحكم");
  isPermDialogOpen.value = false;
  editingPerm.value = null;
  permName.value = "";
  fetchPermissions();
}

function handleDeletePermission(_id: number) {
  alert("حذف الصلاحيات يتم من لوحة التحكم (Filament)");
}

async function handleRoleSubmit() {
  const payload = { name: roleName.value, permissions: rolePerms.value };
  if (editingRole.value) {
    await axiosInstance.put(
      `v1/vendor/roles/${editingRole.value.id}`,
      payload
    );
  } else {
    await axiosInstance.post("v1/vendor/roles", payload);
  }
  isRoleDialogOpen.value = false;
  editingRole.value = null;
  roleName.value = "";
  rolePerms.value = [];
  fetchRoles();
}

async function handleDeleteRole(id: number) {
  if (confirm("حذف الدور؟")) {
    await axiosInstance.delete(`v1/vendor/roles/${id}`);
    fetchRoles();
  }
}

const filteredRoles = computed(() =>
  roles.value.filter((r: any) =>
    r.name.toLowerCase().includes(rolesSearch.value.toLowerCase())
  )
);

const paginatedRoles = computed(() =>
  filteredRoles.value.slice(
    (rolesPage.value - 1) * perPage,
    rolesPage.value * perPage
  )
);

const rolesTotalPages = computed(() =>
  Math.ceil(filteredRoles.value.length / perPage)
);

const userTableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "name", label: "الاسم" },
  { key: "username", label: "اسم المستخدم" },
  { key: "vendor", label: "المتجر" },
  { key: "role", label: "الدور" },
  { key: "salary", label: "الراتب" },
  { key: "commission", label: "العمولة" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

const roleTableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "name", label: "اسم الدور" },
  { key: "permissions", label: "الصلاحيات" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

function openRoleDialogForNew() {
  editingRole.value = null;
  roleName.value = "";
  rolePerms.value = [];
  isRoleDialogOpen.value = true;
}

function openRoleDialogForEdit(r: any) {
  editingRole.value = r;
  roleName.value = r.name;
  rolePerms.value = r.permissions.map((p: any) => p.name);
  isRoleDialogOpen.value = true;
}

function onRolePermChange(name: string, e: Event) {
  const target = e.target as HTMLInputElement | null;
  const checked = !!target?.checked;
  if (checked) {
    rolePerms.value = [...rolePerms.value, name];
  } else {
    rolePerms.value = rolePerms.value.filter((p) => p !== name);
  }
}

function downloadUsersCsv() {
  const rows = filteredUsers.value.map((u) => ({
    name: u.name,
    username: u.username,
    role: u.role ?? u.roles?.[0]?.name ?? "",
    salary: u.salary ?? "",
    commission_type: u.commission_type ?? "",
    commission_value: u.commission_value ?? "",
  }));
  downloadCsv(
    rows,
    ["الاسم", "اسم المستخدم", "الدور", "الراتب", "نوع العمولة", "قيمة العمولة"],
    "users.csv"
  );
}

function downloadRolesCsv() {
  const rows = filteredRoles.value.map((r: any) => ({
    name: r.name,
    permissions: r.permissions.map((p: any) => p.name).join(", "),
  }));
  downloadCsv(rows, ["الدور", "الصلاحيات"], "roles.csv");
}

// downloadCsv imported from "@/utils/csv"
</script>


