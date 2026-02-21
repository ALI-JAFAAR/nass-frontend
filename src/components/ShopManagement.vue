<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center">
        <h2 class="text-blue-800 font-semibold flex items-center gap-2">
          {{ isSuperAdmin ? "إدارة المتاجر" : "بيانات المتجر" }}
        </h2>
        <button
          v-if="canCreateShops"
          class="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          @click="openDialogForNew"
        >
          متجر جديد
        </button>
      </div>
      <div class="px-4 pb-4">
        <input
          v-if="isSuperAdmin"
          v-model="searchTerm"
          placeholder="🔍 ابحث عن متجر..."
          class="w-full mb-4 border rounded px-3 py-2"
        />
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border-b px-2 py-1 text-right">#</th>
              <th class="border-b px-2 py-1 text-right">اسم المتجر</th>
              <th class="border-b px-2 py-1 text-right">نوع المتجر</th>
              <th class="border-b px-2 py-1 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(shop, i) in filtered" :key="shop.id">
              <td class="border-b px-2 py-1">{{ i + 1 }}</td>
              <td class="border-b px-2 py-1">{{ shop.name }}</td>
              <td class="border-b px-2 py-1">
                <span
                  class="px-2 py-1 rounded-full border text-xs"
                  :class="shop.vendor_type === 'agency'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : shop.vendor_type === 'reseller'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'"
                >
                  {{ shop.vendor_type === 'agency'
                    ? 'وكالة'
                    : shop.vendor_type === 'reseller'
                      ? 'بائع وكالة'
                      : 'عادي' }}
                </span>
              </td>
              <td class="border-b px-2 py-1">
                <button
                  v-if="canEditShops"
                  class="px-3 py-1 border rounded text-xs"
                  @click="openDialogForEdit(shop)"
                >
                  تعديل
                </button>
                <button
                  v-if="canDeleteShops"
                  class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
                  @click="handleDelete(shop.id)"
                >
                  حذف
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog -->
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isDialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-sm p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingShop ? "تعديل المتجر" : "إضافة متجر" }}
        </h3>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block mb-1 text-sm">اسم المتجر *</label>
            <input
              v-model="formData.name"
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <!-- Vendor type & agency: super admin only -->
          <div v-if="isSuperAdmin">
            <label class="block mb-1 text-sm">نوع المتجر</label>
            <select v-model="formData.vendor_type" class="w-full border rounded px-3 py-2 bg-white">
              <option value="standard">عادي</option>
              <option value="agency">وكالة</option>
              <option value="reseller">بائع وكالة</option>
            </select>
          </div>

          <div v-if="isSuperAdmin && formData.vendor_type === 'reseller'">
            <label class="block mb-1 text-sm">الوكالة</label>
            <select
              v-model.number="formData.agency_vendor_id"
              class="w-full border rounded px-3 py-2 bg-white"
            >
              <option :value="null">اختر الوكالة</option>
              <option v-for="a in agencies" :key="a.id" :value="a.id">
                {{ a.name }}
              </option>
            </select>
            <p class="text-[11px] text-gray-500 mt-1">
              سيتم خصم المخزون من الوكالة المختارة عند إنشاء الطلبات.
            </p>
          </div>
          <div class="flex gap-2">
            <button
              v-if="canSubmitForm"
              type="submit"
              class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
            >
              {{ editingShop ? "تحديث" : "إضافة" }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded border"
              @click="isDialogOpen = false"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

interface Shop {
  id: number;
  name: string;
  vendor_type?: "standard" | "agency" | "reseller";
  agency_vendor_id?: number | null;
}

const auth = useAuthStore();
const shops = ref<Shop[]>([]);
const agencies = ref<Array<{ id: number; name: string }>>([]);
const searchTerm = ref("");
const isDialogOpen = ref(false);
const editingShop = ref<Shop | null>(null);
const formData = ref<{
  name: string;
  vendor_type: "standard" | "agency" | "reseller";
  agency_vendor_id: number | null;
}>({ name: "", vendor_type: "standard", agency_vendor_id: null });

const permissions = computed(() => auth.user?.permissions || []);
const hasPermission = (perm: string) => permissions.value.includes(perm);

const isSuperAdmin = computed(() => !auth.user?.vendor_id);

/** Super admin only: create new vendors */
const canCreateShops = computed(
  () =>
    isSuperAdmin.value &&
    (hasPermission("إدارة المحلات") ||
      hasPermission("تعديل المحلات") ||
      hasPermission("manage vendors") ||
      hasPermission("manage shops")),
);

/** Super admin only: edit vendors. Vendor users cannot edit. */
const canEditShops = computed(
  () =>
    isSuperAdmin.value &&
    (hasPermission("إدارة المحلات") ||
      hasPermission("تعديل المحلات") ||
      hasPermission("manage vendors") ||
      hasPermission("manage shops")),
);

/** Super admin only: delete vendors */
const canDeleteShops = computed(
  () =>
    isSuperAdmin.value &&
    (hasPermission("حذف المحلات") ||
      hasPermission("إدارة المحلات") ||
      hasPermission("manage vendors") ||
      hasPermission("manage shops")),
);

/** Can submit form: create (super admin) or update (vendor user or super admin) */
const canSubmitForm = computed(
  () =>
    (editingShop.value
      ? canEditShops.value
      : canCreateShops.value),
);

onMounted(() => {
  fetchShops();
  fetchAgencies();
});

async function fetchShops() {
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  shops.value = Array.isArray(list) ? list : [];
}

async function fetchAgencies() {
  try {
    const res = await axiosInstance.get("v1/agencies");
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    agencies.value = Array.isArray(list) ? list : [];
  } catch {
    agencies.value = [];
  }
}

async function handleSubmit() {
  try {
    const payload: any = { name: formData.value.name };
    if (isSuperAdmin.value) {
      payload.vendor_type = formData.value.vendor_type;
      payload.agency_vendor_id =
        formData.value.vendor_type === "reseller"
          ? (formData.value.agency_vendor_id || null)
          : null;
    }
    if (editingShop.value) {
      await axiosInstance.put(
        `v1/admin/vendors/${editingShop.value.id}`,
        payload
      );
    } else {
      await axiosInstance.post("v1/admin/vendors", payload);
    }
    isDialogOpen.value = false;
    resetForm();
    fetchShops();
    fetchAgencies();
  } catch {
    alert("خطأ في الحفظ");
  }
}

async function handleDelete(id: number) {
  if (confirm("هل تريد حذف هذا المتجر؟")) {
    await axiosInstance.delete(`v1/admin/vendors/${id}`);
    fetchShops();
  }
}

function resetForm() {
  editingShop.value = null;
  formData.value = { name: "", vendor_type: "standard", agency_vendor_id: null };
}

const filtered = computed(() => {
  let list = shops.value;
  if (!isSuperAdmin.value && auth.user?.vendor_id) {
    list = list.filter((s) => s.id === auth.user!.vendor_id);
  }
  return list.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

function openDialogForNew() {
  resetForm();
  isDialogOpen.value = true;
}

function openDialogForEdit(shop: Shop) {
  editingShop.value = shop;
  formData.value = {
    name: shop.name,
    vendor_type: (shop.vendor_type as any) || "standard",
    agency_vendor_id: (shop.agency_vendor_id as any) ?? null,
  };
  isDialogOpen.value = true;
}
</script>


