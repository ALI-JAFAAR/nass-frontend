<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">روابط التواصل الاجتماعي</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة إعداد
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="items"
      :loading="loading"
      :search-columns="['facebook_url', 'instagram_url', 'whatsapp_url', 'address']"
      empty-text="لا توجد إعدادات."
    >
      <template #cell-index="{ index }">
        {{ index + 1 }}
      </template>

      <template #cell-facebook_url="{ item }">
        <span class="truncate max-w-xs block">
          {{ item.facebook_url }}
        </span>
      </template>

      <template #cell-instagram_url="{ item }">
        <span class="truncate max-w-xs block">
          {{ item.instagram_url }}
        </span>
      </template>

      <template #cell-whatsapp_url="{ item }">
        <span class="truncate max-w-xs block">
          {{ item.whatsapp_url }}
        </span>
      </template>

      <template #cell-address="{ item }">
        <span class="truncate max-w-xs block">
          {{ item.address }}
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

    <!-- Dialog -->
    <div
      v-if="dialog.open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
    >
      <div class="bg-white rounded shadow-lg w-full max-w-md p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            {{ dialog.mode === 'create' ? 'إضافة إعداد' : 'تعديل إعداد' }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm mb-1">رابط فيسبوك</label>
            <input
              v-model="form.facebook_url"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">رابط إنستغرام</label>
            <input
              v-model="form.instagram_url"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">رابط واتساب</label>
            <input
              v-model="form.whatsapp_url"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">العنوان</label>
            <input
              v-model="form.address"
              type="text"
              class="border rounded px-2 py-1 w-full text-sm"
            />
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

interface SocialSetting {
  id: number;
  facebook_url?: string | null;
  instagram_url?: string | null;
  whatsapp_url?: string | null;
  address?: string | null;
}

const items = ref<SocialSetting[]>([]);
const loading = ref(false);

const dialog = reactive({
  open: false,
  mode: "create" as "create" | "edit",
  id: null as number | null,
});

const form = reactive<{
  facebook_url: string;
  instagram_url: string;
  whatsapp_url: string;
  address: string;
}>({
  facebook_url: "",
  instagram_url: "",
  whatsapp_url: "",
  address: "",
});

const formErrors = reactive<Record<string, string | null>>({
  global: null,
});

const saving = ref(false);

const tableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "facebook_url", label: "فيسبوك" },
  { key: "instagram_url", label: "إنستغرام" },
  { key: "whatsapp_url", label: "واتساب" },
  { key: "address", label: "العنوان" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

const resetForm = () => {
  form.facebook_url = "";
  form.instagram_url = "";
  form.whatsapp_url = "";
  form.address = "";
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

const fetchSettings = async () => {
  loading.value = true;
  try {
    const res = await axiosInstance.get("v1/admin/social-settings");
    const data = res.data;
    items.value = data.data ?? data ?? [];
  } catch (e) {
    console.error("Failed to fetch social settings", e);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  dialog.open = true;
};

const openEdit = (row: SocialSetting) => {
  dialog.mode = "edit";
  dialog.id = row.id;
  resetForm();
  form.facebook_url = row.facebook_url ?? "";
  form.instagram_url = row.instagram_url ?? "";
  form.whatsapp_url = row.whatsapp_url ?? "";
  form.address = row.address ?? "";
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
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      whatsapp_url: form.whatsapp_url || null,
      address: form.address || null,
    };

    if (dialog.mode === "create") {
      await axiosInstance.post("v1/admin/social-settings", payload);
    } else if (dialog.id != null) {
      await axiosInstance.put(
        `v1/admin/social-settings/${dialog.id}`,
        payload
      );
    }

    dialog.open = false;
    await fetchSettings();
  } catch (err: any) {
    const resp = err?.response?.data;
    if (resp?.errors) {
      // currently we don't have per-field errors, keep global
      formErrors.global = "تحقق من صحة البيانات المدخلة.";
    } else if (resp?.message) {
      formErrors.global = String(resp.message);
    } else {
      formErrors.global = "حدث خطأ غير متوقع.";
    }
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (row: SocialSetting) => {
  if (!window.confirm("هل أنت متأكد من حذف هذا الإعداد؟")) return;
  try {
    await axiosInstance.delete(`v1/admin/social-settings/${row.id}`);
    await fetchSettings();
  } catch (e) {
    console.error("Failed to delete social setting", e);
  }
};

fetchSettings();
</script>


