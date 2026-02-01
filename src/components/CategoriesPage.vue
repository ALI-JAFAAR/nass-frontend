<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">الأقسام</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة قسم
      </button>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="filters.search"
        type="text"
        class="border rounded px-2 py-1 text-sm w-64"
        placeholder="بحث بالاسم..."
        @keyup.enter="fetchCategories"
      />
      <button
        class="px-3 py-1 rounded bg-gray-100 text-sm"
        @click="fetchCategories"
      >
        بحث
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="categories"
      :loading="loading"
      :search-columns="['name', 'parent', 'vendor']"
      empty-text="لا توجد أقسام."
    >
      <template #cell-id="{ item }">
        {{ item.id }}
      </template>

      <template #cell-image_path="{ item }">
        <img
          v-if="item.image_path"
          :src="item.image_path"
          alt=""
          class="w-10 h-10 object-cover rounded"
        />
      </template>

      <template
        v-if="isSuperAdmin"
        #cell-vendor="{ item }"
      >
        {{ item.vendor?.name ?? "—" }}
      </template>

      <template #cell-name="{ item }">
        {{ item.name }}
      </template>

      <template #cell-parent="{ item }">
        {{ item.parent?.name ?? "—" }}
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
    <div v-if="dialog.open" class="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div class="bg-white rounded shadow-lg w-full max-w-lg p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            {{ dialog.mode === 'create' ? 'إضافة قسم' : 'تعديل قسم' }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <div class="space-y-3">
          <div v-if="isSuperAdmin">
            <label class="block text-sm mb-1">المحل</label>
            <select
              v-model="selectedVendorId"
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
          </div>
          <div>
            <label class="block text-sm mb-1">اسم القسم</label>
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
            <label class="block text-sm mb-1">القسم الرئيسي</label>
            <select
              v-model="form.parent_id"
              class="border rounded px-2 py-1 w-full text-sm"
            >
              <option :value="null">— بدون —</option>
              <option
                v-for="opt in parentOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.name }}
              </option>
            </select>
            <div v-if="formErrors.parent_id" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.parent_id }}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="cat-active"
              v-model="form.is_active"
              type="checkbox"
              class="h-4 w-4"
            />
            <label for="cat-active" class="text-sm">مفعل</label>
          </div>

          <div>
            <label class="block text-sm mb-1">صورة القسم</label>
            <input
              type="file"
              accept="image/*"
              @change="onFileChange"
            />
            <div v-if="formErrors.image" class="text-xs text-red-600 mt-0.5">
              {{ formErrors.image }}
            </div>
            <div class="mt-2 flex items-center gap-2">
              <img
                v-if="imagePreview"
                :src="imagePreview"
                alt=""
                class="w-16 h-16 object-cover rounded border"
              />
              <span v-if="currentImage && !imagePreview" class="text-xs text-gray-500">
                صورة حالية موجودة.
              </span>
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
import { onMounted, reactive, ref, computed } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface Category {
  id: number;
  name: string;
  is_active: boolean;
  image_path?: string | null;
  parent?: { id: number; name: string } | null;
  vendor_id?: number | null;
}

const auth = useAuthStore();

const user = computed(() => auth.user);
const isSuperAdmin = computed(() => !user.value?.vendor_id);

interface VendorOption {
  id: number;
  name: string;
}

const vendors = ref<VendorOption[]>([]);

const categories = ref<Category[]>([]);
const allCategories = ref<Category[]>([]);
const loading = ref(false);

const filters = reactive({
  page: 1,
  search: "",
});

const pagination = reactive({
  current: 1,
  perPage: 15,
  total: 0,
  from: 0,
  to: 0,
  prev: false,
  next: false,
});

const tableColumns = computed<BaseTableColumn[]>(() => {
  const cols: BaseTableColumn[] = [
    { key: "id", label: "#" },
    { key: "image_path", label: "الصورة" },
  ];

  if (isSuperAdmin.value) {
    cols.push({ key: "vendor", label: "المحل" });
  }

  cols.push(
    { key: "name", label: "الاسم" },
    { key: "parent", label: "القسم الرئيسي" },
    { key: "is_active", label: "مفعل" },
    {
      key: "actions",
      label: "إجراءات",
      headerClass: "text-center",
      cellClass: "text-center",
    },
  );

  return cols;
});

const dialog = reactive({
  open: false,
  mode: "create" as "create" | "edit",
  id: null as number | null,
});

const form = reactive<{
  name: string;
  parent_id: number | null;
  is_active: boolean;
}>({
  name: "",
  parent_id: null,
  is_active: true,
});

const selectedVendorId = ref<number | null>(null);

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  name: null,
  parent_id: null,
  image: null,
});

const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const currentImage = ref<string | null>(null);

const parentOptions = computed(() =>
  allCategories.value.filter((c) => c.id !== dialog.id)
);

const resetForm = () => {
  form.name = "";
  form.parent_id = null;
  form.is_active = true;
  selectedVendorId.value = null;
  imageFile.value = null;
  imagePreview.value = null;
  currentImage.value = null;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

const fetchCategories = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.search) {
      params.search = filters.search;
    }
    const resp = await axiosInstance.get("/v1/admin/categories", { params });
    const data = resp.data;
    categories.value = data.data ?? data;

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
      pagination.perPage = categories.value.length;
      pagination.total = categories.value.length;
      pagination.from = categories.value.length ? 1 : 0;
      pagination.to = categories.value.length;
      pagination.prev = false;
      pagination.next = false;
    }
  } catch (e) {
    console.error("Failed to fetch categories", e);
  } finally {
    loading.value = false;
  }
};

const fetchAllCategories = async () => {
  try {
    const resp = await axiosInstance.get("/v1/admin/categories", {
      params: { all: 1 },
    });
    allCategories.value = resp.data ?? [];
  } catch (e) {
    console.error("Failed to fetch all categories", e);
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchCategories();
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  dialog.open = true;
};

const openEdit = (cat: Category) => {
  dialog.mode = "edit";
  dialog.id = cat.id;
  resetForm();
  form.name = cat.name;
  form.is_active = !!cat.is_active;
  form.parent_id = cat.parent?.id ?? null;
  if (isSuperAdmin.value) {
    selectedVendorId.value =
      (cat as any).vendor?.id ?? (cat.vendor_id as number | null) ?? null;
  }
  currentImage.value = cat.image_path ?? null;
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
};

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    imageFile.value = null;
    imagePreview.value = null;
    return;
  }
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};

const saving = ref(false);

const submit = async () => {
  saving.value = true;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });

  try {
    const fd = new FormData();
    fd.append("name", form.name ?? "");
    if (form.parent_id !== null) {
      fd.append("parent_id", String(form.parent_id));
    }
    fd.append("is_active", form.is_active ? "1" : "0");

    const u = user.value;
    if (isSuperAdmin.value) {
      if (selectedVendorId.value != null) {
        fd.append("vendor_id", String(selectedVendorId.value));
      }
    } else if (u?.vendor_id) {
      fd.append("vendor_id", String(u.vendor_id));
    }

    if (imageFile.value) {
      fd.append("image", imageFile.value);
    }

    if (dialog.mode === "create") {
      await axiosInstance.post("/v1/admin/categories", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else if (dialog.id != null) {
      fd.append("_method", "PUT");
      await axiosInstance.post(`/v1/admin/categories/${dialog.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    dialog.open = false;
    await Promise.all([fetchCategories(), fetchAllCategories()]);
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

const confirmDelete = async (cat: Category) => {
  if (!window.confirm(`هل أنت متأكد من حذف القسم "${cat.name}"؟`)) return;
  try {
    await axiosInstance.delete(`/v1/admin/categories/${cat.id}`);
    await Promise.all([fetchCategories(), fetchAllCategories()]);
  } catch (e) {
    console.error("Failed to delete category", e);
  }
};

onMounted(() => {
  fetchCategories();
  fetchAllCategories();
  if (isSuperAdmin.value) {
    axiosInstance
      .get("/v1/admin/vendors")
      .then((resp) => {
        const data = resp.data;
        const list = Array.isArray(data) ? data : data.data;
        vendors.value = (Array.isArray(list) ? list : []).map((v: any) => ({
          id: v.id,
          name: v.name,
        }));
      })
      .catch((e) => {
        console.error("Failed to fetch vendors", e);
      });
  }
});
</script>

<style scoped>
table th,
table td {
  white-space: nowrap;
}
</style>


