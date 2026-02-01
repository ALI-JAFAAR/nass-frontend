<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">المحافظات</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة محافظة
      </button>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="filters.search"
        type="text"
        class="border rounded px-2 py-1 text-sm w-64"
        placeholder="بحث بالاسم أو الرمز..."
        @keyup.enter="fetchGovernorates"
      />
      <button
        class="px-3 py-1 rounded bg-gray-100 text-sm"
        @click="fetchGovernorates"
      >
        بحث
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="items"
      :loading="loading"
       :search-columns="['name', 'code']"
      empty-text="لا توجد بيانات."
    >
      <template #cell-index="{ index }">
        {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
      </template>

      <template #cell-name="{ item }">
        {{ item.name }}
      </template>

      <template #cell-code="{ item }">
        {{ item.code }}
      </template>

      <template #cell-is_active="{ item }">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
          :class="item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
        >
          {{ item.is_active ? "نعم" : "لا" }}
        </span>
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
            {{ dialog.mode === 'create' ? 'إضافة محافظة' : 'تعديل محافظة' }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm mb-1">اسم المحافظة</label>
            <input
              v-model="form.name"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
            <div v-if="formErrors.name" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.name }}
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">رمز المحافظة</label>
            <input
              v-model="form.code"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
            <div v-if="formErrors.code" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.code }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              id="gov-active"
              v-model="form.is_active"
              type="checkbox"
              class="h-4 w-4"
            />
            <label for="gov-active" class="text-sm">مفعل</label>
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
import { computed, reactive, ref } from "vue";
import axiosInstance from "@/api/axios";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface Governorate {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

const items = ref<Governorate[]>([]);
const loading = ref(false);

const filters = reactive({
  page: 1,
  search: "",
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
  { key: "name", label: "الاسم" },
  { key: "code", label: "الرمز" },
  { key: "is_active", label: "مفعل" },
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
  name: string;
  code: string;
  is_active: boolean;
}>({
  name: "",
  code: "",
  is_active: true,
});

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  name: null,
  code: null,
});

const saving = ref(false);

const resetForm = () => {
  form.name = "";
  form.code = "";
  form.is_active = true;
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

const fetchGovernorates = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.search) {
      params.search = filters.search;
    }
    const resp = await axiosInstance.get("v1/admin/governorates", {
      params,
    });
    applyPagination(resp.data);
  } catch (e) {
    console.error("Failed to fetch governorates", e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchGovernorates();
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  dialog.open = true;
};

const openEdit = (g: Governorate) => {
  dialog.mode = "edit";
  dialog.id = g.id;
  resetForm();
  form.name = g.name;
  form.code = g.code;
  form.is_active = !!g.is_active;
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
      name: form.name,
      code: form.code,
      is_active: form.is_active,
    };

    if (dialog.mode === "create") {
      await axiosInstance.post("v1/admin/governorates", payload);
    } else if (dialog.id != null) {
      await axiosInstance.put(
        `v1/admin/governorates/${dialog.id}`,
        payload
      );
    }

    dialog.open = false;
    await fetchGovernorates();
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

const confirmDelete = async (g: Governorate) => {
  if (!window.confirm(`هل أنت متأكد من حذف المحافظة "${g.name}"؟`)) return;
  try {
    await axiosInstance.delete(`v1/admin/governorates/${g.id}`);
    await fetchGovernorates();
  } catch (e) {
    console.error("Failed to delete governorate", e);
  }
};

fetchGovernorates();
</script>

<style scoped>
table th,
table td {
  white-space: nowrap;
}
</style>


