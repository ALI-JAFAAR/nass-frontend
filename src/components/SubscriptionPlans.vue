<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border">
      <div class="px-4 py-3 flex justify-between items-center border-b">
        <h2 class="text-blue-800 font-semibold">خطط الاشتراك</h2>
        <button
          class="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          @click="openDialogForNew"
        >
          خطة جديدة
        </button>
      </div>
      <div class="p-4">
        <input
          v-model="searchTerm"
          placeholder="🔍 ابحث عن خطة..."
          class="w-full mb-4 border rounded px-3 py-2"
        />
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border-b px-2 py-1 text-right">#</th>
              <th class="border-b px-2 py-1 text-right">الاسم</th>
              <th class="border-b px-2 py-1 text-right">السعر</th>
              <th class="border-b px-2 py-1 text-right">المدة (يوم)</th>
              <th class="border-b px-2 py-1 text-right">مفعلة</th>
              <th class="border-b px-2 py-1 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(plan, i) in filteredPlans" :key="plan.id">
              <td class="border-b px-2 py-1">{{ i + 1 }}</td>
              <td class="border-b px-2 py-1">{{ plan.name }}</td>
              <td class="border-b px-2 py-1">{{ plan.price }}</td>
              <td class="border-b px-2 py-1">{{ plan.duration_days }}</td>
              <td class="border-b px-2 py-1">
                <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ plan.is_active ? "نعم" : "لا" }}
                </span>
              </td>
              <td class="border-b px-2 py-1">
                <button
                  class="px-3 py-1 border rounded text-xs"
                  @click="openDialogForEdit(plan)"
                >
                  تعديل
                </button>
                <button
                  class="px-3 py-1 rounded bg-red-600 text-white text-xs ml-2"
                  @click="handleDelete(plan.id)"
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
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-5" dir="rtl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingPlan ? "تعديل الخطة" : "إضافة خطة" }}
        </h3>
        <form class="space-y-3" @submit.prevent="handleSubmit">
          <div>
            <label class="block mb-1 text-sm">اسم الخطة *</label>
            <input
              v-model="formData.name"
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block mb-1 text-sm">السعر *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                v-model.number="formData.price"
                required
                class="w-full border rounded px-3 py-2"
              />
            </div>
            <div class="flex-1">
              <label class="block mb-1 text-sm">المدة (أيام) *</label>
              <input
                type="number"
                min="1"
                v-model.number="formData.duration_days"
                required
                class="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label class="block mb-1 text-sm">الوصف</label>
            <textarea
              v-model="formData.description"
              class="w-full border rounded px-3 py-2"
              rows="3"
            />
          </div>
          <div class="flex items-center gap-2">
            <input
              id="plan-active"
              type="checkbox"
              v-model="formData.is_active"
            />
            <label for="plan-active" class="text-sm">الخطة مفعلة</label>
          </div>
          <div class="flex gap-2 mt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded bg-green-600 text-white"
            >
              {{ editingPlan ? "تحديث" : "إضافة" }}
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

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  description?: string | null;
  is_active: boolean;
}

const plans = ref<SubscriptionPlan[]>([]);
const searchTerm = ref("");
const isDialogOpen = ref(false);
const editingPlan = ref<SubscriptionPlan | null>(null);
const formData = ref<{
  name: string;
  price: number | null;
  duration_days: number | null;
  description: string | null;
  is_active: boolean;
}>({
  name: "",
  price: null,
  duration_days: null,
  description: null,
  is_active: true,
});

onMounted(() => {
  fetchPlans();
});

async function fetchPlans() {
  const res = await axiosInstance.get("v1/admin/subscription-plans");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  plans.value = Array.isArray(list) ? list : [];
}

async function handleSubmit() {
  try {
    const payload = {
      ...formData.value,
      price: formData.value.price ?? 0,
      duration_days: formData.value.duration_days ?? 30,
    };
    if (editingPlan.value) {
      await axiosInstance.put(
        `v1/admin/subscription-plans/${editingPlan.value.id}`,
        payload,
      );
    } else {
      await axiosInstance.post("v1/admin/subscription-plans", payload);
    }
    isDialogOpen.value = false;
    resetForm();
    fetchPlans();
  } catch {
    alert("حدث خطأ أثناء حفظ الخطة");
  }
}

async function handleDelete(id: number) {
  if (!confirm("هل تريد حذف هذه الخطة؟")) return;
  await axiosInstance.delete(`v1/admin/subscription-plans/${id}`);
  fetchPlans();
}

function resetForm() {
  editingPlan.value = null;
  formData.value = {
    name: "",
    price: null,
    duration_days: null,
    description: null,
    is_active: true,
  };
}

const filteredPlans = computed(() =>
  plans.value.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.value.toLowerCase()),
  ),
);

function openDialogForNew() {
  resetForm();
  isDialogOpen.value = true;
}

function openDialogForEdit(plan: SubscriptionPlan) {
  editingPlan.value = plan;
  formData.value = {
    name: plan.name,
    price: plan.price,
    duration_days: plan.duration_days,
    description: plan.description ?? null,
    is_active: plan.is_active,
  };
  isDialogOpen.value = true;
}
</script>


