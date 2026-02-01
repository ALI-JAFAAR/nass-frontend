<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center">
        <h2 class="text-blue-800 font-semibold flex items-center gap-2">
          إدارة المتاجر
        </h2>
        <button
          class="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          @click="openDialogForNew"
        >
          متجر جديد
        </button>
      </div>
      <div class="px-4 pb-4">
        <input
          v-model="searchTerm"
          placeholder="🔍 ابحث عن متجر..."
          class="w-full mb-4 border rounded px-3 py-2"
        />
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border-b px-2 py-1 text-right">#</th>
              <th class="border-b px-2 py-1 text-right">اسم المتجر</th>
              <th class="border-b px-2 py-1 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(shop, i) in filtered" :key="shop.id">
              <td class="border-b px-2 py-1">{{ i + 1 }}</td>
              <td class="border-b px-2 py-1">{{ shop.name }}</td>
              <td class="border-b px-2 py-1">
                <button
                  v-if="hasPermission('تعديل المحلات')"
                  class="px-3 py-1 border rounded text-xs"
                  @click="openDialogForEdit(shop)"
                >
                  تعديل
                </button>
                <button
                  v-if="hasPermission('حذف المحلات')"
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
          <div class="flex gap-2">
            <button
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
}

const auth = useAuthStore();
const shops = ref<Shop[]>([]);
const searchTerm = ref("");
const isDialogOpen = ref(false);
const editingShop = ref<Shop | null>(null);
const formData = ref({ name: "" });

const permissions = computed(() => auth.user?.permissions || []);
const hasPermission = (perm: string) => permissions.value.includes(perm);

onMounted(() => {
  fetchShops();
});

async function fetchShops() {
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  shops.value = Array.isArray(list) ? list : [];
}

async function handleSubmit() {
  try {
    if (editingShop.value) {
      await axiosInstance.put(
        `v1/admin/vendors/${editingShop.value.id}`,
        formData.value
      );
    } else {
      await axiosInstance.post("v1/admin/vendors", formData.value);
    }
    isDialogOpen.value = false;
    resetForm();
    fetchShops();
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
  formData.value = { name: "" };
}

const filtered = computed(() =>
  shops.value.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);

function openDialogForNew() {
  resetForm();
  isDialogOpen.value = true;
}

function openDialogForEdit(shop: Shop) {
  editingShop.value = shop;
  formData.value = { name: shop.name };
  isDialogOpen.value = true;
}
</script>


