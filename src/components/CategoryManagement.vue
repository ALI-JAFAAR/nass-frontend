<template>
  <div class="bg-white/60 backdrop-blur-sm border border-blue-100 rounded-lg">
    <div class="px-4 py-3 border-b">
      <div class="flex justify-between items-center">
        <h3 class="flex items-center gap-2 text-blue-800 font-semibold">
          إدارة الفئات
        </h3>
        <button
          v-if="hasPermission('اضافة فئة')"
          class="px-3 py-1.5 rounded text-sm text-white bg-gradient-to-r from-green-500 to-emerald-500"
          @click="openDialogForNew"
        >
          إضافة فئة
        </button>
      </div>
    </div>
    <div class="p-4">
      <div v-if="loading" class="py-10 text-center text-gray-500">
        جاري التحميل...
      </div>
      <div
        v-else-if="categories.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <p>لا توجد فئات محددة</p>
      </div>
      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="category in categories"
          :key="category.id"
          class="p-3 bg-white rounded-lg border border-blue-100 flex justify-between items-center group"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: category.color }"
            />
            <div>
              <span class="font-medium text-sm">{{ category.name }}</span>
              <p v-if="category.description" class="text-xs text-gray-500">
                {{ category.description }}
              </p>
              <span
                v-if="category.shop_id === null"
                class="inline-block mt-1 px-1.5 py-0.5 border rounded text-xs"
              >
                فئة عامة
              </span>
            </div>
          </div>
          <div
            v-if="hasPermission('تعديل الفئات') || hasPermission('حذف الفئات')"
            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              v-if="hasPermission('تعديل الفئات')"
              class="w-6 h-6 flex items-center justify-center rounded border text-xs"
              @click="openDialogForEdit(category)"
            >
              ✏️
            </button>
            <button
              v-if="hasPermission('حذف الفئات')"
              class="w-6 h-6 flex items-center justify-center rounded border text-xs text-red-500"
              @click="handleDelete(category.id)"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="isDialogOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة" }}
        </h3>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block mb-1 text-sm">اسم الفئة *</label>
            <input
              v-model="formData.name"
              required
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label class="block mb-1 text-sm">لون الفئة</label>
            <div class="flex gap-2 mt-2">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                class="w-8 h-8 rounded-full border-2"
                :class="formData.color === color ? 'border-gray-800' : 'border-gray-300'"
                :style="{ backgroundColor: color }"
                @click="formData.color = color"
              />
            </div>
          </div>
          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
            >
              {{ editingCategory ? "تحديث" : "إضافة" }}
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
import { ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  shop_id?: number | null;
  vendor_id?: number | null;
}

const props = defineProps<{
  categories: Category[];
}>();

const emit = defineEmits<{
  (e: "update:categories", value: Category[]): void;
}>();

const auth = useAuthStore();
const permissions = ref(auth.user?.permissions || []);
const hasPermission = (perm: string) => permissions.value.includes(perm);

const isDialogOpen = ref(false);
const editingCategory = ref<Category | null>(null);
const formData = ref({
  name: "",
  description: "",
  color: "#3B82F6",
});
const loading = ref(false);

const colors = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

const categories = ref<Category[]>(props.categories);

function syncCategories(value: Category[]) {
  categories.value = value;
  emit("update:categories", value);
}

function openDialogForNew() {
  editingCategory.value = null;
  formData.value = { name: "", description: "", color: "#3B82F6" };
  isDialogOpen.value = true;
}

function openDialogForEdit(category: Category) {
  editingCategory.value = category;
  formData.value = {
    name: category.name,
    description: category.description || "",
    color: category.color,
  };
  isDialogOpen.value = true;
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!formData.value.name) {
    alert("اسم الفئة مطلوب");
    return;
  }

  try {
    loading.value = true;
    const payload = {
      ...formData.value,
      ...(editingCategory.value ? {} : { shop_id: auth.user?.shop_id }),
    };

    const base = "v1/admin/categories";

    if (editingCategory.value) {
      const res = await axiosInstance.put(
        `${base}/${editingCategory.value.id}`,
        payload
      );
      syncCategories(
        categories.value.map((c) =>
          c.id === editingCategory.value?.id ? res.data : c
        )
      );
    } else {
      const res = await axiosInstance.post(base, payload);
      syncCategories([...categories.value, res.data]);
    }

    isDialogOpen.value = false;
    formData.value = { name: "", description: "", color: "#3B82F6" };
    editingCategory.value = null;
  } catch {
    alert("خطأ أثناء الحفظ");
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: number) {
  const base = "v1/admin/categories";
  await axiosInstance.delete(`${base}/${id}`);
  syncCategories(categories.value.filter((c) => c.id !== id));
}
</script>


