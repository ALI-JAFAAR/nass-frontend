<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">التقييمات</h2>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="filters.search"
        type="text"
        class="border rounded px-2 py-1 text-sm w-64"
        placeholder="بحث باسم المنتج أو العميل..."
        @keyup.enter="fetchReviews"
      />
      <select
        v-model.number="filters.rating"
        class="border rounded px-2 py-1 text-sm"
      >
        <option :value="0">كل التقييمات</option>
        <option v-for="r in [5,4,3,2,1]" :key="r" :value="r">
          {{ r }} نجوم
        </option>
      </select>
      <button
        class="px-3 py-1 rounded bg-gray-100 text-sm"
        @click="fetchReviews"
      >
        بحث
      </button>
    </div>

    <BaseTable
      :columns="tableColumns"
      :items="filtered"
      :loading="loading"
      :search-columns="['product', 'customer_name', 'comment']"
      empty-text="لا توجد تقييمات."
    >
      <template #cell-index="{ index }">
        {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
      </template>

      <template #cell-product="{ item }">
        {{ item.product?.name ?? "-" }}
      </template>

      <template #cell-customer_name="{ item }">
        {{ item.customer_name }}
      </template>

      <template #cell-rating="{ item }">
        {{ item.rating }}
      </template>

      <template #cell-comment="{ item }">
        <span class="max-w-xs truncate block">
          {{ item.comment }}
        </span>
      </template>

      <template #cell-reply="{ item }">
        <span class="max-w-xs truncate block">
          {{ item.reply }}
        </span>
      </template>

      <template #cell-created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template #cell-actions="{ item }">
        <div class="space-x-2 space-x-reverse">
          <button
            class="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            @click="openReply(item)"
          >
            رد
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

    <!-- Reply Dialog -->
    <div
      v-if="dialog.open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
    >
      <div class="bg-white rounded shadow-lg w-full max-w-md p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-base">
            رد على تقييم
          </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <div v-if="currentReview" class="space-y-2 text-sm">
          <div>
            <span class="font-semibold">المنتج:</span>
            {{ currentReview.product?.name ?? "-" }}
          </div>
          <div>
            <span class="font-semibold">العميل:</span>
            {{ currentReview.customer_name }}
          </div>
          <div>
            <span class="font-semibold">التقييم:</span>
            {{ currentReview.rating }}
          </div>
          <div>
            <span class="font-semibold">التعليق:</span>
            {{ currentReview.comment }}
          </div>
        </div>

        <div>
          <label class="block text-sm mb-1">رد الإدارة</label>
          <textarea
            v-model="replyText"
            rows="4"
            class="border rounded px-2 py-1 w-full text-sm"
          ></textarea>
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
            @click="submitReply"
          >
            {{ saving ? "جار الحفظ..." : "حفظ الرد" }}
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

interface Review {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  comment?: string | null;
  reply?: string | null;
  created_at?: string | null;
  product?: { id: number; name: string };
}

const reviews = ref<Review[]>([]);
const loading = ref(false);

const filters = reactive({
  page: 1,
  rating: 0,
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
  { key: "product", label: "المنتج" },
  { key: "customer_name", label: "العميل" },
  { key: "rating", label: "التقييم" },
  { key: "comment", label: "التعليق" },
  { key: "reply", label: "الرد" },
  { key: "created_at", label: "تاريخ التقييم" },
  {
    key: "actions",
    label: "إجراءات",
    headerClass: "text-center",
    cellClass: "text-center",
  },
]);

const dialog = reactive({
  open: false,
});

const currentReview = ref<Review | null>(null);
const replyText = ref("");
const saving = ref(false);

const applyPagination = (data: any) => {
  reviews.value = data.data ?? data;
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
    pagination.perPage = reviews.value.length;
    pagination.total = reviews.value.length;
    pagination.from = reviews.value.length ? 1 : 0;
    pagination.to = reviews.value.length;
    pagination.prev = false;
    pagination.next = false;
  }
};

const fetchReviews = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.rating) params.rating = filters.rating;
    const res = await axiosInstance.get("v1/admin/reviews", {
      params,
    });
    applyPagination(res.data);
  } catch (e) {
    console.error("Failed to fetch reviews", e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchReviews();
};

const openReply = (r: Review) => {
  currentReview.value = r;
  replyText.value = r.reply ?? "";
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
  currentReview.value = null;
  replyText.value = "";
};

const submitReply = async () => {
  if (!currentReview.value) return;
  saving.value = true;
  try {
    await axiosInstance.put(`v1/admin/reviews/${currentReview.value.id}`, {
      reply: replyText.value || null,
    });
    dialog.open = false;
    await fetchReviews();
  } catch (e) {
    console.error("Failed to update review", e);
    alert("حدث خطأ أثناء حفظ الرد");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (r: Review) => {
  if (!window.confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
  try {
    await axiosInstance.delete(`v1/admin/reviews/${r.id}`);
    await fetchReviews();
  } catch (e) {
    console.error("Failed to delete review", e);
  }
};

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
};

const filtered = computed(() =>
  reviews.value.filter((r) => {
    if (!filters.search) return true;
    const term = filters.search.toLowerCase();
    return (
      r.product?.name?.toLowerCase().includes(term) ||
      r.customer_name.toLowerCase().includes(term) ||
      (r.comment ?? "").toLowerCase().includes(term)
    );
  }),
);

onMounted(() => {
  fetchReviews();
});
</script>


