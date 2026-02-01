<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">العروض</h2>
      <button
        class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        إضافة عرض
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="filters.search"
        type="text"
        class="border rounded px-2 py-1 text-sm w-64"
        placeholder="بحث بالعنوان..."
        @keyup.enter="fetchOffers"
      />
      <button
        class="px-3 py-1 rounded bg-gray-100 text-sm"
        @click="fetchOffers"
      >
        بحث
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="offers"
      :loading="loading"
      :search-columns="['title', 'type', 'discount_type']"
      empty-text="لا توجد عروض."
    >
      <template #cell-index="{ index }">
        {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
      </template>

      <template #cell-image="{ item }">
        <img
          v-if="item.image"
          :src="item.image"
          alt=""
          class="w-16 h-12 object-cover rounded border"
        />
      </template>

      <template #cell-title="{ item }">
        {{ item.title }}
      </template>

      <template #cell-type="{ item }">
        {{ item.type === "single" ? "منتج واحد" : "عدة منتجات" }}
      </template>

      <template #cell-discount_type="{ item }">
        {{ item.discount_type === "percent" ? "نسبة" : "سعر ثابت" }}
      </template>

      <template #cell-discount_value="{ item }">
        {{ item.discount_value }}
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
      <div class="bg-white rounded shadow-lg w-full max-w-3xl p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            {{ dialog.mode === "create" ? "إضافة عرض" : "تعديل عرض" }}
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm">
          {{ formErrors.global }}
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div v-if="isSuperAdmin">
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
            </div>
            <div>
              <label class="block text-sm mb-1">نوع العرض</label>
              <select
                v-model="form.type"
                class="border rounded px-2 py-1 w-full text-sm"
              >
                <option value="single">منتج واحد</option>
                <option value="bundle">عدة منتجات</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">عنوان العرض</label>
              <input
                v-model="form.title"
                type="text"
                class="border rounded px-2 py-1 w-full text-sm"
              />
              <div v-if="formErrors.title" class="text-xs text-red-600 mt-0.5">
                {{ formErrors.title }}
              </div>
            </div>
            <div>
              <label class="block text-sm mb-1">الوصف</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="border rounded px-2 py-1 w-full text-sm"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm mb-1">نوع الخصم</label>
              <select
                v-model="form.discount_type"
                class="border rounded px-2 py-1 w-full text-sm"
              >
                <option value="percent">نسبة</option>
                <option value="fixed">سعر ثابت</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">قيمة الخصم</label>
              <input
                v-model.number="form.discount_value"
                type="number"
                min="0"
                step="0.01"
                class="border rounded px-2 py-1 w-full text-sm"
              />
            </div>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block text-sm mb-1">بداية العرض</label>
                <input
                  v-model="form.starts_at"
                  type="datetime-local"
                  class="border rounded px-2 py-1 w-full text-sm"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm mb-1">نهاية العرض</label>
                <input
                  v-model="form.ends_at"
                  type="datetime-local"
                  class="border rounded px-2 py-1 w-full text-sm"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input
                id="offer-active"
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4"
              />
              <label for="offer-active" class="text-sm">مفعل</label>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm mb-1">صورة العرض</label>
              <input type="file" accept="image/*" @change="onFileChange" />
              <div v-if="formErrors.image" class="text-xs text-red-600 mt-0.5">
                {{ formErrors.image }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  alt=""
                  class="w-24 h-20 object-cover rounded border"
                />
                <span
                  v-else-if="currentImage"
                  class="text-xs text-gray-500"
                >
                  صورة حالية موجودة.
                </span>
              </div>
            </div>

            <div class="border rounded p-2 max-h-72 overflow-y-auto">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-sm">منتجات العرض</h4>
                <button
                  type="button"
                  class="px-2 py-1 rounded border text-xs"
                  @click="addItem"
                >
                  إضافة منتج
                </button>
              </div>
              <div
                v-for="(item, idx) in items"
                :key="idx"
                class="mb-2 border rounded p-2 space-y-2"
              >
                <div>
                  <label class="block text-xs mb-1">المنتج</label>
                  <select
                    v-model.number="item.product_id"
                    class="border rounded px-2 py-1 w-full text-sm"
                    @change="onItemProductChange(idx)"
                  >
                    <option :value="0">اختر المنتج</option>
                    <option
                      v-for="p in products"
                      :key="p.id"
                      :value="p.id"
                    >
                      {{ p.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs mb-1">النسخة (إن وجدت)</label>
                  <select
                    v-model.number="item.variant_id"
                    class="border rounded px-2 py-1 w-full text-sm"
                  >
                    <option :value="null">بدون</option>
                    <option
                      v-for="v in itemVariants(idx)"
                      :key="v.id"
                      :value="v.id"
                    >
                      {{ v.label }}
                    </option>
                  </select>
                </div>
                <button
                  type="button"
                  class="px-2 py-1 rounded bg-red-600 text-white text-xs"
                  @click="removeItem(idx)"
                >
                  إزالة
                </button>
              </div>
              <p class="text-xs text-gray-500">
                يتم استخدام المنتجات والنسخ المحددة لحساب الأسعار المخفّضة في الواجهة
                الأمامية كما في Filament.
              </p>
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
            {{ saving ? "جار الحفظ..." : "حفظ" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface Offer {
  id: number;
  vendor_id?: number | null;
  type: "single" | "bundle";
  title: string;
  description?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  image?: string | null;
}

interface VendorOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  variants?: { id: number; label: string }[];
}

const auth = useAuthStore();
const offers = ref<Offer[]>([]);
const vendors = ref<VendorOption[]>([]);
const products = ref<ProductOption[]>([]);
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
  { key: "image", label: "الصورة" },
  { key: "title", label: "العنوان" },
  { key: "type", label: "النوع" },
  { key: "discount_type", label: "نوع الخصم" },
  { key: "discount_value", label: "قيمة الخصم" },
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
  vendor_id: number | null;
  type: "single" | "bundle";
  title: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}>({
  vendor_id: null,
  type: "single",
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: null,
  starts_at: null,
  ends_at: null,
  is_active: true,
});

const items = ref<Array<{ product_id: number; variant_id: number | null }>>([]);

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  title: null,
  image: null,
});

const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const currentImage = ref<string | null>(null);
const saving = ref(false);

const user = computed(() => auth.user);
const isSuperAdmin = computed(() => !user.value?.vendor_id);

const resetForm = () => {
  form.vendor_id = null;
  form.type = "single";
  form.title = "";
  form.description = "";
  form.discount_type = "percent";
  form.discount_value = null;
  form.starts_at = null;
  form.ends_at = null;
  form.is_active = true;
  items.value = [];
  imageFile.value = null;
  imagePreview.value = null;
  currentImage.value = null;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

const applyPagination = (data: any) => {
  offers.value = data.data ?? data;
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
    pagination.perPage = offers.value.length;
    pagination.total = offers.value.length;
    pagination.from = offers.value.length ? 1 : 0;
    pagination.to = offers.value.length;
    pagination.prev = false;
    pagination.next = false;
  }
};

const fetchOffers = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.search) params.search = filters.search;
    const res = await axiosInstance.get("v1/admin/offers", { params });
    applyPagination(res.data);
  } catch (e) {
    console.error("Failed to fetch offers", e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchOffers();
};

const fetchVendors = async () => {
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  vendors.value = Array.isArray(list) ? list : [];
};

const fetchProducts = async () => {
  // Use cashier products endpoint to get products + variants for the selected vendor.
  const params: any = {};
  if (isSuperAdmin.value && form.vendor_id) {
    params.vendor_id = form.vendor_id;
  }
  if (!isSuperAdmin.value && auth.user?.vendor_id) {
    params.vendor_id = auth.user.vendor_id;
  }

  const res = await axiosInstance.get("v1/cashier/products", { params });
  const list = res.data?.data ?? [];
  products.value = (Array.isArray(list) ? list : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    variants: Array.isArray(p.variants)
      ? p.variants.map((v: any) => ({
          id: v.id,
          label:
            [v.color, v.size]
              .filter(Boolean)
              .join(" • ") || `#${v.id}`,
        }))
      : [],
  }));
};

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  resetForm();
  if (!isSuperAdmin.value && auth.user?.vendor_id) {
    form.vendor_id = auth.user.vendor_id;
  }
  dialog.open = true;
  fetchProducts();
};

const openEdit = (o: Offer) => {
  dialog.mode = "edit";
  dialog.id = o.id;
  resetForm();
  form.vendor_id = o.vendor_id ?? null;
  form.type = o.type;
  form.title = o.title;
  form.description = o.description ?? "";
  form.discount_type = o.discount_type;
  form.discount_value = o.discount_value;
  form.is_active = !!o.is_active;
  // starts_at / ends_at come as ISO; map to datetime-local value if needed.
  form.starts_at = o.starts_at
    ? o.starts_at.substring(0, 16)
    : null;
  form.ends_at = o.ends_at
    ? o.ends_at.substring(0, 16)
    : null;
  currentImage.value = o.image ?? null;
  dialog.open = true;
  fetchProducts();

  // Fetch items from show endpoint if needed in future; currently we only edit metadata.
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

const addItem = () => {
  items.value.push({ product_id: 0, variant_id: null });
};

const removeItem = (idx: number) => {
  items.value.splice(idx, 1);
};

const onItemProductChange = (idx: number) => {
  const item = items.value[idx];
  if (item) {
    item.variant_id = null;
  }
};

const itemVariants = (idx: number) => {
  const pid = items.value[idx]?.product_id;
  if (!pid) return [];
  const p = products.value.find((x) => x.id === pid);
  return p?.variants ?? [];
};

const buildPayload = () => {
  const payload: any = {
    vendor_id: form.vendor_id,
    type: form.type,
    title: form.title,
    description: form.description || null,
    discount_type: form.discount_type,
    discount_value: form.discount_value ?? 0,
    is_active: form.is_active ? 1 : 0,
  };
  if (form.starts_at) payload.starts_at = form.starts_at;
  if (form.ends_at) payload.ends_at = form.ends_at;

  if (items.value.length) {
    payload.items = items.value
      .filter((i) => i.product_id)
      .map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
      }));
  }

  return payload;
};

const submit = async () => {
  saving.value = true;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });

  try {
    const payload = buildPayload();
    const fd = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (key === "items") {
        fd.append("items", JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    });
    if (imageFile.value) {
      fd.append("image", imageFile.value);
    }

    const config = {
      headers: { "Content-Type": "multipart/form-data" },
    };

    if (dialog.mode === "create") {
      await axiosInstance.post("v1/admin/offers", fd, config);
    } else if (dialog.id != null) {
      await axiosInstance.post(
        `v1/admin/offers/${dialog.id}?_method=PUT`,
        fd,
        config,
      );
    }

    dialog.open = false;
    await fetchOffers();
  } catch (err: any) {
    const resp = err?.response?.data;
    if (resp?.errors) {
      const fieldErrors = resp.errors as Record<string, string[]>;
      Object.entries(fieldErrors).forEach(([key, msgs]) => {
        const first = Array.isArray(msgs) ? msgs[0] : (msgs as any);
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

const confirmDelete = async (o: Offer) => {
  if (!window.confirm(`هل أنت متأكد من حذف العرض "${o.title}"؟`)) return;
  try {
    await axiosInstance.delete(`v1/admin/offers/${o.id}`);
    await fetchOffers();
  } catch (e) {
    console.error("Failed to delete offer", e);
  }
};

onMounted(async () => {
  await fetchOffers();
  if (isSuperAdmin.value) {
    await fetchVendors();
  }
});
</script>


