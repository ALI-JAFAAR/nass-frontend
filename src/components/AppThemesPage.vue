<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">ثيم التطبيق</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة ثيم
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="items"
      :loading="loading"
      :search-columns="['name']"
      empty-text="لا توجد ثيمات."
    >
      <template #cell-index="{ index }">
        {{ index + 1 }}
      </template>

      <template #cell-name="{ item }">
        {{ item.name }}
      </template>

      <template #cell-is_active="{ item }">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
          :class="item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
        >
          {{ item.is_active ? "نشط" : "غير نشط" }}
        </span>
      </template>

      <template #cell-updated_at="{ item }">
        {{ item.updated_at ? new Date(item.updated_at).toLocaleString() : "—" }}
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

    <!-- Dialog -->
    <div
      v-if="dialog.open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
    >
      <div class="bg-white rounded shadow-lg w-full max-w-3xl p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            {{ dialog.mode === 'create' ? 'إضافة ثيم' : 'تعديل ثيم' }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-1">اسم الثيم</label>
              <input
                v-model="form.name"
                type="text"
                class="border rounded px-2 py-1 w-full text-sm"
              />
              <div v-if="formErrors.name" class="text-xs text-red-600 mt-0.5">
                {{ formErrors.name }}
              </div>
            </div>
            <div class="flex items-center gap-2 mt-6 md:mt-0">
              <input
                id="theme-active"
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4"
              />
              <label for="theme-active" class="text-sm">تعيين كثيم نشط</label>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <h4 class="font-semibold text-sm mb-1">الوضع الفاتح</h4>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs mb-1">الأساسي</label>
                  <input v-model="form.light_primary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الثانوي</label>
                  <input v-model="form.light_secondary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الخلفية</label>
                  <input v-model="form.light_background" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">السطح</label>
                  <input v-model="form.light_surface" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">النص على الأساسي</label>
                  <input v-model="form.light_on_primary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">النص على السطح</label>
                  <input v-model="form.light_on_surface" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الإطار</label>
                  <input v-model="form.light_border" type="color" class="w-full h-9 border rounded" />
                </div>
              </div>

              <div class="mt-3">
                <label class="block text-sm mb-1">شعار الوضع الفاتح</label>
                <input type="file" accept="image/*" @change="onFileChange($event, 'light')" />
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-semibold text-sm mb-1">الوضع الداكن</h4>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs mb-1">الأساسي</label>
                  <input v-model="form.dark_primary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الثانوي</label>
                  <input v-model="form.dark_secondary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الخلفية</label>
                  <input v-model="form.dark_background" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">السطح</label>
                  <input v-model="form.dark_surface" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">النص على الأساسي</label>
                  <input v-model="form.dark_on_primary" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">النص على السطح</label>
                  <input v-model="form.dark_on_surface" type="color" class="w-full h-9 border rounded" />
                </div>
                <div>
                  <label class="block text-xs mb-1">الإطار</label>
                  <input v-model="form.dark_border" type="color" class="w-full h-9 border rounded" />
                </div>
              </div>

              <div class="mt-3">
                <label class="block text-sm mb-1">شعار الوضع الداكن</label>
                <input type="file" accept="image/*" @change="onFileChange($event, 'dark')" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-3 py-1 rounded border text-sm"
              @click="closeDialog"
            >
              إلغاء
            </button>
            <button
              type="submit"
              class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              :disabled="saving"
            >
              {{ saving ? 'جار الحفظ...' : 'حفظ' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import axiosInstance from "@/api/axios";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface AppTheme {
  id: number;
  name: string;
  is_active: boolean;
  updated_at?: string;
}

const items = ref<AppTheme[]>([]);
const loading = ref(false);

const dialog = reactive({
  open: false,
  mode: "create" as "create" | "edit",
  id: null as number | null,
});

const form = reactive<any>({
  name: "",
  is_active: true,
  light_primary: "#FF5252",
  light_secondary: "#FF6B6B",
  light_background: "#F8FAFC",
  light_surface: "#FFFFFF",
  light_on_primary: "#FFFFFF",
  light_on_surface: "#111827",
  light_border: "#E5E7EB",
  dark_primary: "#FF5252",
  dark_secondary: "#FF6B6B",
  dark_background: "#0B1220",
  dark_surface: "#111827",
  dark_on_primary: "#FFFFFF",
  dark_on_surface: "#E5E7EB",
  dark_border: "#33222B45",
});

const logoLightFile = ref<File | null>(null);
const logoDarkFile = ref<File | null>(null);

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  name: null,
});

const saving = ref(false);

const tableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "name", label: "الاسم" },
  { key: "is_active", label: "مفعل" },
  { key: "updated_at", label: "آخر تحديث" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

const resetForm = () => {
  form.name = "";
  form.is_active = true;
  logoLightFile.value = null;
  logoDarkFile.value = null;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

const fetchThemes = async () => {
  loading.value = true;
  try {
    const res = await axiosInstance.get("v1/admin/app-themes");
    const data = res.data;
    items.value = data.data ?? data ?? [];
  } catch (e) {
    console.error("Failed to fetch themes", e);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  fetchDefaultsIfExisting();
  dialog.open = true;
};

const fetchDefaultsIfExisting = () => {
  // if there is an active theme, reuse its colors as defaults for new theme
  const active = items.value.find((t) => t.is_active);
  if (!active) return;
};

const openEdit = (t: any) => {
  dialog.mode = "edit";
  dialog.id = t.id;
  resetForm();
  Object.assign(form, {
    name: t.name,
    is_active: !!t.is_active,
    light_primary: t.light_primary ?? form.light_primary,
    light_secondary: t.light_secondary ?? form.light_secondary,
    light_background: t.light_background ?? form.light_background,
    light_surface: t.light_surface ?? form.light_surface,
    light_on_primary: t.light_on_primary ?? form.light_on_primary,
    light_on_surface: t.light_on_surface ?? form.light_on_surface,
    light_border: t.light_border ?? form.light_border,
    dark_primary: t.dark_primary ?? form.dark_primary,
    dark_secondary: t.dark_secondary ?? form.dark_secondary,
    dark_background: t.dark_background ?? form.dark_background,
    dark_surface: t.dark_surface ?? form.dark_surface,
    dark_on_primary: t.dark_on_primary ?? form.dark_on_primary,
    dark_on_surface: t.dark_on_surface ?? form.dark_on_surface,
    dark_border: t.dark_border ?? form.dark_border,
  });
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
};

const onFileChange = (e: Event, type: "light" | "dark") => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  if (type === "light") {
    logoLightFile.value = file;
  } else {
    logoDarkFile.value = file;
  }
};

const buildFormData = () => {
  const fd = new FormData();
  fd.append("name", form.name ?? "");
  fd.append("is_active", form.is_active ? "1" : "0");
  const colorKeys = [
    "light_primary",
    "light_secondary",
    "light_background",
    "light_surface",
    "light_on_primary",
    "light_on_surface",
    "light_border",
    "dark_primary",
    "dark_secondary",
    "dark_background",
    "dark_surface",
    "dark_on_primary",
    "dark_on_surface",
    "dark_border",
  ];
  colorKeys.forEach((k) => {
    if (form[k]) {
      fd.append(k, form[k]);
    }
  });
  if (logoLightFile.value) {
    fd.append("logo_light", logoLightFile.value);
  }
  if (logoDarkFile.value) {
    fd.append("logo_dark", logoDarkFile.value);
  }
  return fd;
};

const submit = async () => {
  saving.value = true;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });

  try {
    const fd = buildFormData();

    if (dialog.mode === "create") {
      await axiosInstance.post("v1/admin/app-themes", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else if (dialog.id != null) {
      await axiosInstance.post(
        `v1/admin/app-themes/${dialog.id}?_method=PUT`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    }

    dialog.open = false;
    await fetchThemes();
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

const confirmDelete = async (t: AppTheme) => {
  if (!window.confirm(`هل أنت متأكد من حذف الثيم "${t.name}"؟`)) return;
  try {
    await axiosInstance.delete(`v1/admin/app-themes/${t.id}`);
    await fetchThemes();
  } catch (e) {
    console.error("Failed to delete theme", e);
  }
};

fetchThemes();
</script>


