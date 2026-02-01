<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">أسعار التوصيل</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة سعر توصيل
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <select
        v-model="filters.vendorId"
        class="border rounded px-2 py-1 text-sm"
      >
        <option :value="0">كل المحلات</option>
        <option
          v-for="v in vendors"
          :key="v.id"
          :value="v.id"
        >
          {{ v.name }}
        </option>
      </select>
      <button
        class="px-3 py-1 rounded bg-gray-100 text-sm"
        @click="fetchFees"
      >
        تحديث
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="items"
      :loading="loading"
      :search-columns="['governorate', 'vendor']"
      empty-text="لا توجد أسعار توصيل."
    >
      <template #cell-index="{ index }">
        {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
      </template>

      <template #cell-governorate="{ item }">
        {{ item.governorate?.name ?? "—" }}
      </template>

      <template #cell-vendor="{ item }">
        {{ item.vendor?.name ?? "—" }}
      </template>

      <template #cell-fee="{ item }">
        {{ Number(item.fee).toFixed(2) }}
      </template>

      <template #cell-actions="{ item }">
        <div class="space-x-2 space-x-reverse">
          <button
            class="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            @click="openEdit(item)"
          >
            تعديل
          </button>
          <button
            class="px-2 py-0.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
            @click="confirmDelete(item)"
          >
            حذف
          </button>
        </div>
      </template>
    </BaseTable>

    <div
      v-if="pagination.total > pagination.perPage"
      class="flex items-center justify-between text-sm mt-2"
    >
      <div>
        عرض
        {{ pagination.from }}
        -
        {{ pagination.to }}
        من
        {{ pagination.total }}
      </div>
      <div class="space-x-2 space-x-reverse">
        <button
          class="px-2 py-1 border rounded"
          :disabled="!pagination.prev"
          @click="changePage(pagination.current - 1)"
        >
          السابق
        </button>
        <button
          class="px-2 py-1 border rounded"
          :disabled="!pagination.next"
          @click="changePage(pagination.current + 1)"
        >
          التالي
        </button>
      </div>
    </div>

    <!-- Dialog -->
    <div
      v-if="dialog.open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
    >
      <div class="bg-white rounded shadow-lg w-full max-w-md p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            {{ dialog.mode === 'create' ? 'إضافة سعر توصيل' : 'تعديل سعر التوصيل' }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm mb-1">المحافظة</label>
            <select
              v-model="form.governorate_id"
              class="border rounded px-2 py-1 w-full text-sm"
            >
              <option :value="null">اختر المحافظة</option>
              <option
                v-for="g in governorates"
                :key="g.id"
                :value="g.id"
              >
                {{ g.name }}
              </option>
            </select>
            <div v-if="formErrors.governorate_id" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.governorate_id }}
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">المحل</label>
            <select
              v-model="form.vendor_id"
              class="border rounded px-2 py-1 w-full text-sm"
            >
              <option :value="null">اختر المحل</option>
              <option
                v-for="v in vendors"
                :key="v.id"
                :value="v.id"
              >
                {{ v.name }}
              </option>
            </select>
            <div v-if="formErrors.vendor_id" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.vendor_id }}
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">سعر التوصيل</label>
            <input
              v-model.number="form.fee"
              type="number"
              min="0"
              step="0.01"
              class="border rounded px-2 py-1 w-full text-sm"
            />
            <div v-if="formErrors.fee" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.fee }}
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            class="px-3 py-1 rounded border text-sm"
            @click="closeDialog"
          >
            إلغاء
          </button>
          <button
            class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            :disabled="saving"
            @click="submit"
          >
            {{ saving ? 'جار الحفظ...' : 'حفظ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import axiosInstance from "@/api/axios";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface VendorOption {
  id: number;
  name: string;
}

interface GovernorateOption {
  id: number;
  name: string;
}

interface ShippingFee {
  id: number;
  governorate_id: number;
  vendor_id: number;
  fee: number;
  governorate?: { id: number; name: string; code: string };
  vendor?: { id: number; name: string };
}

const vendors = ref<VendorOption[]>([]);
const governorates = ref<GovernorateOption[]>([]);
const items = ref<ShippingFee[]>([]);
const loading = ref(false);

const filters = reactive({
  page: 1,
  vendorId: 0,
});

const pagination = reactive({
  current: 1,
  perPage: 20,
  total: 0,
  from: 0,
  to: 0,
  prev: false,
  next: false,
});

const tableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "governorate", label: "المحافظة" },
  { key: "vendor", label: "المحل" },
  { key: "fee", label: "سعر التوصيل" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

const dialog = reactive({
  open: false,
  mode: "create" as "create" | "edit",
  id: null as number | null,
});

const form = reactive<{
  governorate_id: number | null;
  vendor_id: number | null;
  fee: number | null;
}>({
  governorate_id: null,
  vendor_id: null,
  fee: null,
});

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  governorate_id: null,
  vendor_id: null,
  fee: null,
});

const saving = ref(false);

const resetForm = () => {
  form.governorate_id = null;
  form.vendor_id = null;
  form.fee = null;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

const applyPagination = (data: any) => {
  items.value = data.data ?? data;
  if (data.meta && data.links) {
    pagination.current = data.meta.current_page;
    pagination.perPage = data.meta.per_page;
    pagination.total = data.meta.total;
    pagination.from = data.meta.from ?? 0;
    pagination.to = data.meta.to ?? 0;
    pagination.prev = !!data.links.prev;
    pagination.next = !!data.links.next;
  } else {
    pagination.current = 1;
    pagination.perPage = items.value.length;
    pagination.total = items.value.length;
    pagination.from = items.value.length ? 1 : 0;
    pagination.to = items.value.length;
    pagination.prev = false;
    pagination.next = false;
  }
};

const fetchVendors = async () => {
  try {
    const res = await axiosInstance.get("v1/admin/vendors");
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    vendors.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Failed to fetch vendors", e);
  }
};

const fetchGovernorates = async () => {
  try {
    const res = await axiosInstance.get("v1/admin/governorates", {
      params: { all: 1 },
    });
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    governorates.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Failed to fetch governorates", e);
  }
};

const fetchFees = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.vendorId) {
      params.vendor_id = filters.vendorId;
    }
    const res = await axiosInstance.get("v1/admin/shipping-fees", {
      params,
    });
    applyPagination(res.data);
  } catch (e) {
    console.error("Failed to fetch shipping fees", e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchFees();
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  dialog.open = true;
};

const openEdit = (fee: ShippingFee) => {
  dialog.mode = "edit";
  dialog.id = fee.id;
  resetForm();
  form.governorate_id = fee.governorate_id;
  form.vendor_id = fee.vendor_id;
  form.fee = fee.fee;
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
};

const submit = async () => {
  saving.value = true;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });

  try {
    const payload = {
      governorate_id: form.governorate_id,
      vendor_id: form.vendor_id,
      fee: form.fee,
    };

    if (dialog.mode === "create") {
      await axiosInstance.post("v1/admin/shipping-fees", payload);
    } else if (dialog.id != null) {
      await axiosInstance.put(
        `v1/admin/shipping-fees/${dialog.id}`,
        payload
      );
    }

    dialog.open = false;
    await fetchFees();
  } catch (err: any) {
    const resp = err?.response?.data;
    if (resp?.errors) {
      Object.entries(resp.errors).forEach(([key, msgs]) => {
        const first = Array.isArray(msgs) ? msgs[0] : msgs;
        if (key in formErrors) {
          // @ts-ignore
          formErrors[key] = String(first);
        } else {
          formErrors.global = String(first);
        }
      });
    } else if (resp?.message) {
      formErrors.global = String(resp.message);
    } else {
      formErrors.global = "حدث خطأ غير متوقع.";
    }
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (fee: ShippingFee) => {
  if (!window.confirm("هل أنت متأكد من حذف سعر التوصيل؟")) return;
  try {
    await axiosInstance.delete(`v1/admin/shipping-fees/${fee.id}`);
    await fetchFees();
  } catch (e) {
    console.error("Failed to delete shipping fee", e);
  }
};

onMounted(async () => {
  try {
    await Promise.all([fetchVendors(), fetchGovernorates()]);
    await fetchFees();
  } catch (e) {
    // Any unexpected error should be logged but not crash the page
    console.error("Failed to initialize shipping fees page", e);
  }
});
</script>

<style scoped>
table th,
table td {
  white-space: nowrap;
}
</style>


