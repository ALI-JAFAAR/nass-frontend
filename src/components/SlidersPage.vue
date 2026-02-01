<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center border-b">
        <h2 class="text-blue-800 font-semibold">إدارة الإعلانات (السلايدر)</h2>
        <button
          class="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          @click="openDialogForNew"
        >
          إعلان جديد
        </button>
      </div>
      <div class="p-4 space-y-4">
        <div class="flex flex-wrap gap-2">
          <input
            v-model="searchTerm"
            placeholder="🔍 ابحث عن إعلان..."
            class="flex-1 min-w-[160px] border rounded px-3 py-2"
          />
          <select
            v-model="placementFilter"
            class="border rounded px-3 py-2 text-sm"
          >
            <option value="">كل الأماكن</option>
            <option value="home">الصفحة الرئيسية</option>
            <option value="category">قسم معين</option>
          </select>
        </div>

        <BaseTable
          :columns="tableColumns"
          :items="sliders"
          :loading="loading"
          :search-columns="['title', 'placement', 'link_type']"
          empty-text="لا توجد إعلانات."
        >
          <template #cell-index="{ index }">
            {{ (page - 1) * perPage + index + 1 }}
          </template>

          <template #cell-image="{ item }">
            <img
              v-if="item.image"
              :src="item.image_url || storageUrl(item.image)"
              class="w-24 h-16 rounded object-cover border"
            />
          </template>

          <template #cell-title="{ item }">
            {{ item.title }}
          </template>

          <template #cell-placement="{ item }">
            {{ item.placement === "home" ? "الصفحة الرئيسية" : "قسم" }}
          </template>

          <template #cell-link_type="{ item }">
            {{ linkTypeLabel(item.link_type) }}
          </template>

          <template #cell-sort_order="{ item }">
            {{ item.sort_order }}
          </template>

          <template #cell-is_active="{ item }">
            <span
              class="px-2 py-0.5 rounded text-xs"
              :class="item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ item.is_active ? "نعم" : "لا" }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <button
              class="px-3 py-1 border rounded text-xs"
              @click="openDialogForEdit(item)"
            >
              تعديل
            </button>
            <button
              class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
              @click="handleDelete(item.id)"
            >
              حذف
            </button>
          </template>
        </BaseTable>

        <div class="flex justify-end gap-2 mt-4">
          <button
            v-for="pageNum in totalPages"
            :key="pageNum"
            class="px-3 py-1 rounded border text-sm"
            :class="page === pageNum ? 'bg-blue-600 text-white' : ''"
            @click="changePage(pageNum)"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isDialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingSlider ? "تعديل الإعلان" : "إضافة إعلان" }}
        </h3>
        <div class="grid md:grid-cols-2 gap-4">
          <form class="space-y-3" @submit.prevent="handleSubmit">
            <div>
              <label class="block mb-1 text-sm">العنوان</label>
              <input
                v-model="formData.title"
                class="w-full border rounded px-3 py-2"
                maxlength="120"
              />
            </div>
            <div>
              <label class="block mb-1 text-sm">مكان الإعلان *</label>
              <select
                v-model="formData.placement"
                required
                class="w-full border rounded px-3 py-2"
              >
                <option value="home">الصفحة الرئيسية</option>
                <option value="category">قسم معين</option>
              </select>
            </div>
            <div v-if="formData.placement === 'category'">
              <label class="block mb-1 text-sm">معرّف القسم (حالياً رقم فقط)</label>
              <input
                v-model.number="formData.category_id"
                type="number"
                min="1"
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label class="block mb-1 text-sm">عنوان ترويجي</label>
              <input
                v-model="formData.caption"
                class="w-full border rounded px-3 py-2"
                maxlength="160"
              />
            </div>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block mb-1 text-sm">لون الخلفية</label>
                <input
                  v-model="formData.bg_color"
                  type="color"
                  class="w-full h-10 border rounded"
                />
              </div>
              <div class="flex-1">
                <label class="block mb-1 text-sm">لون النص</label>
                <input
                  v-model="formData.text_color"
                  type="color"
                  class="w-full h-10 border rounded"
                />
              </div>
            </div>
            <div>
              <label class="block mb-1 text-sm">نوع الرابط</label>
              <select
                v-model="formData.link_type"
                class="w-full border rounded px-3 py-2"
              >
                <option value="none">بدون</option>
                <option value="url">رابط خارجي</option>
                <option value="product">منتج</option>
                <option value="category">قسم</option>
                <option value="offer">عرض</option>
              </select>
            </div>
            <div v-if="formData.link_type !== 'none'">
              <label class="block mb-1 text-sm">قيمة الرابط *</label>
              <input
                v-model="formData.link_value"
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block mb-1 text-sm">الترتيب</label>
                <input
                  v-model.number="formData.sort_order"
                  type="number"
                  class="w-full border rounded px-3 py-2"
                />
              </div>
              <div class="flex items-center gap-2 mt-6">
                <input
                  id="slider-active"
                  type="checkbox"
                  v-model="formData.is_active"
                />
                <label for="slider-active" class="text-sm">مفعل</label>
              </div>
            </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block mb-1 text-sm">بداية الإعلان</label>
              <input
                v-model="formData.starts_at"
                type="datetime-local"
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div class="flex-1">
              <label class="block mb-1 text-sm">نهاية الإعلان</label>
              <input
                v-model="formData.ends_at"
                type="datetime-local"
                class="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
            <div class="flex gap-2 mt-4">
              <button
                type="submit"
                class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
              >
                {{ editingSlider ? "تحديث" : "إضافة" }}
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

          <!-- Image cropper -->
          <div class="space-y-3">
            <label class="block mb-1 text-sm">الصورة *</label>
            <input type="file" accept="image/*" @change="onFileChange" />

            <div v-if="imageError" class="text-xs text-red-600">
              {{ imageError }}
            </div>

            <div v-if="imageSource" class="border rounded overflow-hidden">
              <Cropper
                :src="imageSource"
                :stencil-props="{ aspectRatio: 16 / 9 }"
                class="h-64 w-full bg-gray-100"
                @change="onCropChange"
              />
            </div>

            <div v-else-if="editingSlider && editingSlider.image">
              <img
                :src="editingSlider.image_url || storageUrl(editingSlider.image)"
                class="w-full h-64 object-cover rounded border"
                alt="current"
              />
            </div>

            <p class="text-xs text-gray-500">
              يمكنك قص وتعديل الصورة قبل الحفظ، كما في محرر الصور في لوحة التحكم
              (Filament).
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface Slider {
  starts_at: any;
  ends_at: any;
  id: number;
  title: string | null;
  placement: "home" | "category";
  category_id?: number | null;
  caption?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  link_type: "none" | "url" | "product" | "category" | "offer";
  link_value?: string | null;
  sort_order: number;
  is_active: boolean;
  image?: string | null;
  image_url?: string | null;
}

const sliders = ref<Slider[]>([]);
const loading = ref(false);
const page = ref(1);
const perPage = ref(20);
const totalPages = ref(1);

const searchTerm = ref("");
const placementFilter = ref<string>("");

const isDialogOpen = ref(false);
const editingSlider = ref<Slider | null>(null);

const formData = ref({
  title: "",
  placement: "home" as "home" | "category",
  category_id: null as number | null,
  caption: "",
  bg_color: "#000000",
  text_color: "#ffffff",
  link_type: "none" as "none" | "url" | "product" | "category" | "offer",
  link_value: "",
  sort_order: 0,
  is_active: true,
  starts_at: "" as string | "",
  ends_at: "" as string | "",
});

const imageSource = ref<string | null>(null);
const imageBlob = ref<Blob | null>(null);
const imageError = ref("");

onMounted(() => {
  fetchSliders();
});

async function fetchSliders() {
  loading.value = true;
  try {
    const res = await axiosInstance.get("v1/admin/sliders", {
      params: {
        page: page.value,
        search: searchTerm.value || undefined,
        placement: placementFilter.value || undefined,
      },
    });
    const data = res.data;
    const list = Array.isArray(data) ? data : data.data;
    sliders.value = Array.isArray(list) ? list : [];
    if (!Array.isArray(data)) {
      totalPages.value = data?.last_page ?? 1;
      perPage.value = data?.per_page ?? 20;
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    if (!editingSlider.value && !imageBlob.value) {
      imageError.value = "يجب اختيار صورة للإعلان";
      return;
    }
    imageError.value = "";

    const fd = new FormData();

    // Normalize payload to what Laravel expects
    const normalized: Record<string, any> = {
      ...formData.value,
      is_active: formData.value.is_active ? 1 : 0,
    };

    Object.entries(normalized).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      fd.append(key, String(value));
    });

    if (imageBlob.value) {
      fd.append("image", imageBlob.value, "slider.jpg");
    }

    const config = {
      headers: {
        // Let the browser set the multipart boundary for file uploads
        "Content-Type": "multipart/form-data",
      },
    };

    if (editingSlider.value) {
      await axiosInstance.post(
        `v1/admin/sliders/${editingSlider.value.id}?_method=PUT`,
        fd,
        config,
      );
    } else {
      await axiosInstance.post("v1/admin/sliders", fd, config);
    }

    isDialogOpen.value = false;
    resetForm();
    fetchSliders();
  } catch (e: any) {
    console.error(e);
    const resp = e?.response?.data;
    if (resp?.errors) {
      const messages: string[] = [];
      Object.values(resp.errors).forEach((arr: any) => {
        if (Array.isArray(arr)) {
          arr.forEach((m) => messages.push(String(m)));
        }
      });
      if (messages.length) {
        alert(messages.join("\n"));
        return;
      }
    }
    alert(resp?.message || "حدث خطأ أثناء حفظ الإعلان");
  }
}

async function handleDelete(id: number) {
  if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
  await axiosInstance.delete(`v1/admin/sliders/${id}`);
  fetchSliders();
}

function resetForm() {
  editingSlider.value = null;
  formData.value = {
    title: "",
    placement: "home",
    category_id: null,
    caption: "",
    bg_color: "#000000",
    text_color: "#ffffff",
    link_type: "none",
    link_value: "",
    sort_order: 0,
    is_active: true,
    starts_at: "",
    ends_at: "",
  };
  imageSource.value = null;
  imageBlob.value = null;
  imageError.value = "";
}

function openDialogForNew() {
  resetForm();
  isDialogOpen.value = true;
}

function openDialogForEdit(s: Slider) {
  editingSlider.value = s;
  formData.value = {
    title: s.title || "",
    placement: s.placement,
    category_id: s.category_id ?? null,
    caption: s.caption || "",
    bg_color: s.bg_color || "#000000",
    text_color: s.text_color || "#ffffff",
    link_type: s.link_type,
    link_value: s.link_value || "",
    sort_order: s.sort_order ?? 0,
    is_active: s.is_active,
    starts_at: s.starts_at ? s.starts_at.substring(0, 16) : "",
    ends_at: s.ends_at ? s.ends_at.substring(0, 16) : "",
  };
  imageSource.value = null;
  imageBlob.value = null;
  isDialogOpen.value = true;
}

function linkTypeLabel(type: string): string {
  switch (type) {
    case "url":
      return "رابط خارجي";
    case "product":
      return "منتج";
    case "category":
      return "قسم";
    case "offer":
      return "عرض";
    default:
      return "بدون";
  }
}

function storageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${window.location.origin}/storage/${path}`;
}

function changePage(pageNum: number) {
  page.value = pageNum;
  fetchSliders();
}

const tableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "image", label: "الصورة" },
  { key: "title", label: "العنوان" },
  { key: "placement", label: "المكان" },
  { key: "link_type", label: "نوع الرابط" },
  { key: "sort_order", label: "الترتيب" },
  { key: "is_active", label: "مفعل" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    imageSource.value = String(ev.target?.result || "");
  };
  reader.readAsDataURL(file);

  // Use the original file as the initial image payload; the cropper
  // will overwrite this via onCropChange if the user adjusts the crop.
  imageBlob.value = file;
  imageError.value = "";
}

function onCropChange({ canvas }: any) {
  if (!canvas) {
    imageBlob.value = null;
    return;
  }
  canvas.toBlob((blob: Blob | null) => {
    imageBlob.value = blob;
  }, "image/jpeg");
}
</script>


