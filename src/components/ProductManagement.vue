<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
      <h2 class="text-2xl font-bold text-blue-800">إدارة المنتجات</h2>
        <p class="text-xs text-gray-500">
          هذه الشاشة تعكس نفس الحقول والعلاقات الموجودة في لوحة Filament.
        </p>
      </div>
      <button
        v-if="hasPermission('تعريف المنتجات')"
        class="px-4 py-2 rounded text-white bg-gradient-to-r from-blue-500 to-purple-500"
        @click="openCreate"
      >
        منتج جديد
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border p-3 flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-600 mb-1">بحث باسم المنتج</label>
          <input
          v-model="filters.search"
          type="text"
            placeholder="ابحث عن المنتجات..."
          class="border rounded px-2 py-1 text-sm w-56"
          @keyup.enter="fetchProducts"
          />
        </div>
      <div v-if="isSuperAdmin">
        <label class="block text-xs text-gray-600 mb-1">المحل</label>
        <select
          v-model.number="filters.vendorId"
          class="border rounded px-2 py-1 text-sm w-56"
        >
          <option :value="0">كل المحلات</option>
          <option
            v-for="v in vendors"
            :key="v.id"
            :value="v.id"
          >
            {{ v.name }}
          </option>
        </select>
      </div>
      <div class="ml-auto flex gap-2">
        <button
          class="px-3 py-1 rounded bg-gray-100 text-sm"
          @click="fetchProducts"
        >
          تحديث
        </button>
      </div>
    </div>

    <!-- Products table -->
    <div class="bg-white rounded-lg border overflow-x-auto">
      <BaseTable
        :columns="productTableColumns"
        :items="filtered"
        :loading="loading"
        :search-columns="['name', 'brand', 'categories']"
        empty-text="لا توجد منتجات."
      >
        <template #cell-index="{ index }">
          {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
        </template>

        <template #cell-first_image_url="{ item }">
          <img
            v-if="item.first_image_url"
            :src="item.first_image_url"
            :alt="item.name"
            class="w-12 h-12 object-cover rounded-full border"
          />
        </template>

        <template #cell-name="{ item }">
          {{ item.name }}
        </template>

        <template #cell-brand="{ item }">
          {{ item.brand?.name ?? "—" }}
        </template>

        <template #cell-categories="{ item }">
          <span class="max-w-xs truncate block">
            {{ item.categories?.map((c: any) => c.name).join(", ") || "—" }}
          </span>
        </template>

        <template #cell-price="{ item }">
          {{ formatPrice(firstVariantPrice(item)) }}
        </template>

        <template #cell-stock="{ item }">
          {{ item.stock }}
        </template>

        <template #cell-is_active="{ item }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
            :class="item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ item.is_active ? "نعم" : "لا" }}
          </span>
        </template>

        <template #cell-featured="{ item }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
            :class="item.featured ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ item.featured ? "نعم" : "لا" }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="space-x-2 space-x-reverse">
            <button
              class="px-2 py-0.5 text-xs rounded border"
              @click="openEdit(item)"
            >
              تعديل
            </button>
            <button
              class="px-2 py-0.5 text-xs rounded bg-red-600 text-white"
              @click="confirmDelete(item)"
            >
              حذف
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.total > pagination.perPage"
      class="flex items-center justify-between text-xs mt-2"
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

    <!-- Product form dialog -->
    <div
      v-if="dialog.open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div
        class="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5"
        dir="rtl"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            {{ dialog.mode === "create" ? "إضافة منتج" : "تعديل منتج" }}
        </h3>
          <button class="text-gray-500" @click="closeDialog">✕</button>
        </div>

        <!-- Tabs: keep everything in one dialog -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            class="px-3 py-2 rounded border text-sm"
            :class="dialogTab === 'form' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'"
            @click="dialogTab = 'form'"
          >
            بيانات المنتج
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded border text-sm disabled:opacity-60"
            :class="dialogTab === 'variants' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'"
            :disabled="!activeDialogProduct"
            @click="dialogTab = 'variants'"
          >
            الخصائص
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded border text-sm disabled:opacity-60"
            :class="dialogTab === 'images' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'"
            :disabled="!activeDialogProduct"
            @click="dialogTab = 'images'"
          >
            الصور
          </button>

          <div v-if="!activeDialogProduct" class="text-xs text-gray-500 flex items-center">
            احفظ المنتج أولاً لتفعيل (الخصائص/الصور).
          </div>
        </div>

        <div v-if="formErrors.global" class="text-red-600 text-sm mb-2">
          {{ formErrors.global }}
        </div>

        <div v-if="dialogTab === 'form'">
        <form class="space-y-4" @submit.prevent="submitProduct">
          <div class="grid md:grid-cols-2 gap-4">
            <div v-if="isSuperAdmin">
              <label class="block mb-1 text-sm">المحل</label>
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
            <label class="block mb-1 text-sm">اسم المنتج *</label>
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
              <label class="block mb-1 text-sm">رمز الطلب / الـ SKU *</label>
              <input
                v-model="form.sku"
                type="text"
                class="border rounded px-2 py-1 w-full text-sm"
              />
            </div>
            <div>
              <div class="flex items-center justify-between gap-2">
                <label class="block mb-1 text-sm">البراند</label>
                <button
                  type="button"
                  class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                  @click="quickCreateBrand"
                >
                  + إضافة
                </button>
              </div>
              <select
                v-model="form.brand_id"
                class="border rounded px-2 py-1 w-full text-sm"
              >
                <option :value="null">بدون</option>
                <option
                  v-for="b in brands"
                  :key="b.id"
                  :value="b.id"
                >
                  {{ b.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between gap-2">
              <label class="block mb-1 text-sm">الأقسام</label>
              <button
                type="button"
                class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                @click="quickCreateCategory"
              >
                + إضافة
              </button>
            </div>
          <div class="relative">
            <div
              class="border rounded px-2 py-1 text-sm bg-white cursor-pointer min-h-[2.25rem] flex flex-wrap gap-1"
              @click="categoryDropdownOpen = !categoryDropdownOpen"
            >
          <span
                v-for="id in form.category_ids"
                :key="id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs"
              >
                {{ categoryNameById(id) }}
              </span>
              <span
                v-if="!form.category_ids.length"
                class="text-gray-400 text-xs"
              >
                اختر الأقسام...
          </span>
        </div>
            <div
              v-if="categoryDropdownOpen"
              class="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-y-auto"
            >
              <div class="p-1 border-b">
                <input
                  v-model="categorySearch"
                  type="text"
                  placeholder="بحث..."
                  class="w-full border rounded px-2 py-1 text-xs"
                />
          </div>
              <div class="p-1 space-y-1">
                <label
                  v-for="c in filteredCategories"
                  :key="c.id"
                  class="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    v-model="form.category_ids"
                    :value="c.id"
                    type="checkbox"
                    class="h-4 w-4"
                  />
                  <span>{{ c.name }}</span>
                </label>
          </div>
          </div>
        </div>
          </div>
          
          <div>
            <label class="block mb-1 text-sm">الوصف</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="border rounded px-2 py-1 w-full text-sm"
            ></textarea>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 text-sm">تفعيل المنتج</label>
              <div class="flex items-center gap-2">
                <input
                  id="prod-active"
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4"
                />
                <label for="prod-active" class="text-sm">مفعل</label>
              </div>
            </div>
            <div>
              <label class="block mb-1 text-sm">أحدث المنتجات</label>
              <div class="flex items-center gap-2">
                <input
                  id="prod-featured"
                  v-model="form.featured"
                  type="checkbox"
                  class="h-4 w-4"
                />
                <label for="prod-featured" class="text-sm">عرض في الأحدث</label>
              </div>
            </div>
          </div>

          <!-- Properties key/value for product -->
          <div>
            <label class="block mb-1 text-sm">خواص المنتج (مفتاح / قيمة)</label>
            <div class="space-y-2">
              <div
                v-for="(pair, idx) in productProperties"
                :key="idx"
                class="flex gap-2"
              >
                <input
                  v-model="pair.key"
                  placeholder="Key"
                  class="flex-1 border rounded px-2 py-1 text-sm"
                />
                <input
                  v-model="pair.value"
                  placeholder="Value"
                  class="flex-1 border rounded px-2 py-1 text-sm"
                />
          <button
                  type="button"
                  class="px-2 py-1 rounded bg-red-600 text-white text-xs"
                  @click="removeProductProperty(idx)"
                >
                  ×
          </button>
              </div>
          <button
                type="button"
                class="px-3 py-1 rounded border text-xs"
                @click="addProductProperty"
            >
                إضافة خاصية
          </button>
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
              class="px-3 py-1 rounded bg-green-600 text-white text-sm"
              :disabled="savingProduct"
            >
              {{ savingProduct ? "جار الحفظ..." : "حفظ" }}
            </button>
          </div>
        </form>
        </div>

        <!-- Variants inline (same dialog) -->
        <div v-else-if="dialogTab === 'variants'">
          <div v-if="!currentProductForVariants" class="text-sm text-gray-600">
            احفظ المنتج أولاً.
          </div>
          <div v-else>
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold">
                خصائص المنتج: {{ currentProductForVariants.name }}
              </h3>
              <button type="button" class="px-3 py-1 border rounded text-sm" @click="dialogTab = 'form'">
                رجوع
              </button>
            </div>

            <div v-if="variantError" class="text-red-600 text-sm mb-2">
              {{ variantError }}
            </div>

            <div class="mb-4">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th class="border-b px-2 py-1 text-right">رمز الخاصية</th>
                    <th class="border-b px-2 py-1 text-right">اللون</th>
                    <th class="border-b px-2 py-1 text-right">الحجم</th>
                    <th class="border-b px-2 py-1 text-right">السعر</th>
                    <th class="border-b px-2 py-1 text-right">المخزن</th>
                    <th class="border-b px-2 py-1 text-right">مفعل</th>
                    <th class="border-b px-2 py-1 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="variants.length === 0">
                    <td colspan="7" class="border-b px-2 py-2 text-center text-gray-500">
                      لا توجد خصائص لهذا المنتج.
                    </td>
                  </tr>
                  <tr v-for="v in variants" :key="v.id">
                    <td class="border-b px-2 py-1">{{ v.sku }}</td>
                    <td class="border-b px-2 py-1">{{ v.color }}</td>
                    <td class="border-b px-2 py-1">{{ v.size }}</td>
                    <td class="border-b px-2 py-1">{{ v.price }}</td>
                    <td class="border-b px-2 py-1">{{ v.stock }}</td>
                    <td class="border-b px-2 py-1">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                        :class="v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
                      >
                        {{ v.is_active ? "نعم" : "لا" }}
                      </span>
                    </td>
                    <td class="border-b px-2 py-1 space-x-2 space-x-reverse">
                      <button class="px-2 py-0.5 text-xs rounded border" @click="startEditVariant(v)">
                        تعديل
                      </button>
                      <button class="px-2 py-0.5 text-xs rounded bg-red-600 text-white" @click="deleteVariant(v)">
                        حذف
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="border-t pt-4 mt-4">
              <h4 class="font-semibold mb-2 text-sm">
                {{ editingVariant ? "تعديل خاصية" : "إضافة خاصية جديدة" }}
              </h4>
              <form class="grid md:grid-cols-2 gap-3" @submit.prevent="submitVariant">
                <div>
                  <label class="block mb-1 text-sm">رمز/اسم الخاصية *</label>
                  <input v-model="variantForm.sku" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block mb-1 text-sm">نوع الخاصية</label>
                  <select v-model="variantForm.type" class="w-full border rounded px-2 py-1 text-sm">
                    <option value="color">لون</option>
                    <option value="size">حجم</option>
                  </select>
                </div>
                <div v-if="variantForm.type === 'color'">
                  <label class="block mb-1 text-sm">اللون</label>
                  <input v-model="variantForm.color" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div v-else>
                  <label class="block mb-1 text-sm">الحجم</label>
                  <input v-model="variantForm.size" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block mb-1 text-sm">السعر</label>
                  <input v-model="variantForm.price" type="number" step="0.01" min="0" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block mb-1 text-sm">المخزن</label>
                  <input v-model="variantForm.stock" type="number" min="0" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div class="flex items-center gap-2 mt-6">
                  <input id="variant-active" v-model="variantForm.is_active" type="checkbox" class="h-4 w-4" />
                  <label for="variant-active" class="text-sm">مفعل</label>
                </div>

                <div class="md:col-span-2">
                  <label class="block mb-1 text-sm">خواص النسخة (مفتاح / قيمة)</label>
                  <div class="space-y-2">
                    <div v-for="(pair, idx) in variantForm.properties" :key="idx" class="flex gap-2">
                      <input v-model="pair.key" placeholder="Key" class="flex-1 border rounded px-2 py-1 text-sm" />
                      <input v-model="pair.value" placeholder="Value" class="flex-1 border rounded px-2 py-1 text-sm" />
                      <button type="button" class="px-2 py-1 rounded bg-red-600 text-white text-xs" @click="removeProperty(idx)">
                        ×
                      </button>
                    </div>
                    <button type="button" class="px-3 py-1 rounded border text-xs" @click="addProperty">
                      إضافة خاصية
                    </button>
                  </div>
                </div>

                <div class="md:col-span-2 flex justify-end gap-2 pt-2">
                  <button type="submit" class="px-4 py-2 rounded bg-green-600 text-white text-sm">
                    {{ editingVariant ? "تحديث الخاصية" : "إضافة الخاصية" }}
                  </button>
                  <button type="button" class="px-4 py-2 rounded border text-sm" @click="resetVariantForm">
                    تهيئة النموذج
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Images inline (same dialog) -->
        <div v-else-if="dialogTab === 'images'">
          <div v-if="!currentProductForImages" class="text-sm text-gray-600">
            احفظ المنتج أولاً.
          </div>
          <div v-else>
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold">
                صور المنتج: {{ currentProductForImages.name }}
              </h3>
              <button type="button" class="px-3 py-1 border rounded text-sm" @click="dialogTab = 'form'">
                رجوع
              </button>
            </div>

            <div v-if="imageError" class="text-red-600 text-sm mb-2">
              {{ imageError }}
            </div>

            <div class="mb-4">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th class="border-b px-2 py-1 text-right">الصورة</th>
                    <th class="border-b px-2 py-1 text-right">الترتيب</th>
                    <th class="border-b px-2 py-1 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="images.length === 0">
                    <td colspan="3" class="border-b px-2 py-2 text-center text-gray-500">
                      لا توجد صور لهذا المنتج.
                    </td>
                  </tr>
                  <tr v-for="img in images" :key="img.id">
                    <td class="border-b px-2 py-1">
                      <img :src="img.url" alt="" class="w-16 h-16 object-cover rounded border" />
                    </td>
                    <td class="border-b px-2 py-1">
                      {{ img.sort_order }}
                    </td>
                    <td class="border-b px-2 py-1 space-x-2 space-x-reverse">
                      <button class="px-2 py-0.5 text-xs rounded border" @click="startEditImage(img)">
                        تعديل
                      </button>
                      <button class="px-2 py-0.5 text-xs rounded bg-red-600 text-white" @click="deleteImage(img)">
                        حذف
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="border-t pt-4 mt-4">
              <h4 class="font-semibold mb-2 text-sm">
                {{ editingImage ? "تعديل صورة" : "إضافة صورة جديدة" }}
              </h4>
              <div class="space-y-3">
                <div>
                  <label class="block mb-1 text-sm">الصورة</label>
                  <input type="file" accept="image/*" @change="onImageFileChange" />
                </div>
                <div>
                  <label class="block mb-1 text-sm">الترتيب</label>
                  <input v-model.number="imageForm.sort_order" type="number" class="border rounded px-2 py-1 w-32 text-sm" />
                </div>
                <div v-if="imagePreview" class="mt-2">
                  <img :src="imagePreview" alt="" class="w-32 h-32 object-cover rounded border" />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button class="px-3 py-1 rounded border text-sm" @click="resetImageForm">
                    تهيئة
                  </button>
                  <button class="px-3 py-1 rounded bg-green-600 text-white text-sm" @click="submitImage">
                    حفظ الصورة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import BaseTable, { type BaseTableColumn } from "./BaseTable.vue";

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface VendorOption {
  id: number;
  name: string;
}

interface Variant {
  id: number;
  sku: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock?: number | null;
  is_active: boolean;
  properties?: Record<string, any> | null;
}

interface ProductImage {
  id: number;
  path: string;
  url: string;
  sort_order: number;
}

interface Product {
  id: number;
  vendor_id?: number | null;
  brand_id?: number | null;
  name: string;
  slug?: string;
  sku: string;
  description?: string | null;
  is_active: boolean;
  featured: boolean;
  stock: number;
  barcode?: string | null;
  first_image_url?: string | null;
  brand?: Brand | null;
  categories?: Category[];
  variants?: Variant[];
  images?: ProductImage[];
  properties?: Record<string, any> | null;
}

const auth = useAuthStore();
const user = computed(() => auth.user);
const isSuperAdmin = computed(() => !user.value?.vendor_id);

const products = ref<Product[]>([]);
const loading = ref(false);

const vendors = ref<VendorOption[]>([]);
const brands = ref<Brand[]>([]);
const categories = ref<Category[]>([]);

const filters = reactive({
  page: 1,
  search: "",
  vendorId: 0,
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

const productTableColumns = computed<BaseTableColumn[]>(() => [
  { key: "index", label: "#" },
  { key: "first_image_url", label: "الصورة" },
  { key: "name", label: "اسم المنتج" },
  { key: "brand", label: "البراند" },
  { key: "categories", label: "الأقسام" },
  { key: "price", label: "السعر (أول خاصية)" },
  { key: "stock", label: "المخزون" },
  { key: "is_active", label: "مفعل" },
  { key: "featured", label: "أحدث المنتجات" },
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

const dialogTab = ref<"form" | "variants" | "images">("form");

const dialogProduct = ref<Product | null>(null);

const activeDialogProduct = computed<Product | null>(() => {
  if (dialogProduct.value) return dialogProduct.value;
  if (dialog.id != null) return products.value.find((p) => p.id === dialog.id) ?? null;
  return null;
});

const form = reactive<{
  vendor_id: number | null;
  brand_id: number | null;
  name: string;
  sku: string;
  description: string;
  is_active: boolean;
  featured: boolean;
  category_ids: number[];
}>({
  vendor_id: null,
  brand_id: null,
  name: "",
  sku: "",
  description: "",
  is_active: true,
  featured: false,
  category_ids: [],
});

const productProperties = ref<Array<{ key: string; value: string }>>([]);
const categoryDropdownOpen = ref(false);
const categorySearch = ref("");

const filteredCategories = computed(() =>
  categories.value.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.value.toLowerCase()),
  ),
);

const categoryNameById = (id: number): string => {
  return categories.value.find((c) => c.id === id)?.name ?? String(id);
};

const formErrors = reactive<Record<string, string | null>>({
  global: null,
  name: null,
  sku: null,
});

const savingProduct = ref(false);

const permissions = computed(() => auth.user?.permissions || []);
const hasPermission = (perm: string) => permissions.value.includes(perm);

const filtered = computed(() =>
  products.value.filter((p) => {
    if (!filters.search) return true;
    return p.name.toLowerCase().includes(filters.search.toLowerCase());
  }),
);

const applyPagination = (data: any) => {
  const list = data.data ?? data;
  products.value = Array.isArray(list) ? list : [];

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
    pagination.perPage = products.value.length;
    pagination.total = products.value.length;
    pagination.from = products.value.length ? 1 : 0;
    pagination.to = products.value.length;
    pagination.prev = false;
    pagination.next = false;
  }
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: filters.page,
    };
    if (filters.search) params.search = filters.search;
    if (isSuperAdmin.value && filters.vendorId) {
      params.vendor_id = filters.vendorId;
    }
    const res = await axiosInstance.get("v1/admin/products", { params });
    applyPagination(res.data);
  } catch (e) {
    console.error("Failed to fetch products", e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1) return;
  filters.page = page;
  fetchProducts();
};

const fetchVendors = async () => {
  const res = await axiosInstance.get("v1/admin/vendors");
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  vendors.value = Array.isArray(list) ? list : [];
};

// Helper to decide which vendor id to use when loading brands/categories
const resolveVendorForOptions = (override?: number | null): number | null => {
  if (typeof override === "number") {
    return override || null;
  }

  if (isSuperAdmin.value) {
    // Super admin: prefer the form vendor (dialog), then the list filter vendor.
    if (form.vendor_id) return form.vendor_id;
    if (filters.vendorId) return filters.vendorId;
    return null;
  }

  return auth.user?.vendor_id ?? null;
};

const fetchBrands = async (vendorIdOverride?: number | null) => {
  const params: Record<string, any> = {};
  const vendorId = resolveVendorForOptions(vendorIdOverride);
  // If no vendor is selected (super admin with no vendor chosen yet),
  // do not load global brands; keep the list empty until a vendor is chosen.
  if (!vendorId) {
    brands.value = [];
    return;
  }
  params.vendor_id = vendorId;
  const res = await axiosInstance.get("v1/admin/brands", { params });
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  brands.value = Array.isArray(list) ? list : [];
};

const fetchCategories = async (vendorIdOverride?: number | null) => {
  const params: Record<string, any> = { all: 1 };
  const vendorId = resolveVendorForOptions(vendorIdOverride);
  if (!vendorId) {
    categories.value = [];
    return;
  }
  params.vendor_id = vendorId;
  const res = await axiosInstance.get("v1/admin/categories", { params });
  const list = Array.isArray(res.data) ? res.data : res.data?.data;
  categories.value = Array.isArray(list) ? list : [];
};

const resetForm = () => {
  // For super admins, default to the currently selected vendor in the filter.
  // For vendor users, always use the user's own vendor id.
  if (isSuperAdmin.value) {
    form.vendor_id = filters.vendorId || null;
  } else {
    form.vendor_id = auth.user?.vendor_id ?? null;
  }
  form.brand_id = null;
  form.name = "";
  form.sku = "";
  form.description = "";
  form.is_active = true;
  form.featured = false;
  form.category_ids = [];
  productProperties.value = [];

  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });
};

// When super admin changes the vendor in the product form, reload brands & categories
watch(
  () => form.vendor_id,
  (val) => {
    if (!isSuperAdmin.value) return;
    // Clear current selections when vendor changes
    form.brand_id = null;
    form.category_ids = [];
    if (val) {
      fetchBrands(val);
      fetchCategories(val);
    } else {
      brands.value = [];
      categories.value = [];
    }
  },
);

// When super admin changes the vendor filter in the header, reload brands/categories
// and align the form vendor (if the dialog is open).
watch(
  () => filters.vendorId,
  (val) => {
    if (!isSuperAdmin.value) return;
    const vendorId = val || null;
    if (dialog.open) {
      form.vendor_id = vendorId;
    }
    fetchBrands(vendorId);
    fetchCategories(vendorId);
  },
);

const openCreate = () => {
  dialog.mode = "create";
  dialog.id = null;
  dialogProduct.value = null;
  dialogTab.value = "form";
  resetForm();
  // Ensure brand/category options are aligned with the chosen vendor when opening the dialog
  if (isSuperAdmin.value) {
    fetchBrands(form.vendor_id);
    fetchCategories(form.vendor_id);
  }
  dialog.open = true;
};

const openEdit = (p: Product) => {
  dialog.mode = "edit";
  dialog.id = p.id;
  dialogProduct.value = p;
  dialogTab.value = "form";
  resetForm();
  form.vendor_id = p.vendor_id ?? null;
  form.brand_id = p.brand_id ?? null;
  form.name = p.name;
  form.sku = p.sku;
  form.description = p.description ?? "";
  form.is_active = !!p.is_active;
  form.featured = !!p.featured;
  form.category_ids = (p.categories ?? []).map((c) => c.id);
  productProperties.value = Object.entries(p.properties ?? {}).map(
    ([key, value]) => ({
      key,
      value: String(value),
    }),
  );
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
  dialogProduct.value = null;
  dialogTab.value = "form";
  currentProductForVariants.value = null;
  variants.value = [];
  resetVariantForm();
  variantError.value = null;
  currentProductForImages.value = null;
  images.value = [];
  resetImageForm();
  imageError.value = null;
};

const addProductProperty = () => {
  productProperties.value.push({ key: "", value: "" });
};

const removeProductProperty = (idx: number) => {
  productProperties.value.splice(idx, 1);
};

const buildProductPayload = () => {
  const props: Record<string, string> = {};
  productProperties.value.forEach((p) => {
    if (p.key) props[p.key] = p.value;
  });

  return {
    vendor_id: form.vendor_id,
    brand_id: form.brand_id,
    name: form.name,
    sku: form.sku,
    description: form.description || null,
    is_active: form.is_active ? 1 : 0,
    featured: form.featured ? 1 : 0,
    properties: Object.keys(props).length ? JSON.stringify(props) : null,
    categories: form.category_ids,
  };
};

const submitProduct = async () => {
  savingProduct.value = true;
  Object.keys(formErrors).forEach((k) => {
    // @ts-ignore
    formErrors[k] = null;
  });

  try {
    const payload = buildProductPayload();

    if (dialog.mode === "create") {
      const res = await axiosInstance.post("v1/admin/products", payload);
      const created = res.data as Product;
      products.value.unshift(created);
      dialog.mode = "edit";
      dialog.id = created.id;
      dialogProduct.value = created;
      // keep the dialog open so user can add images/variants مباشرة داخل نفس النافذة
      dialogTab.value = "variants";
      currentProductForVariants.value = created;
      variants.value = [];
      await fetchVariants(created.id);
      return;
    } else if (dialog.id != null) {
      const res = await axiosInstance.put(
        `v1/admin/products/${dialog.id}`,
        payload,
      );
      products.value = products.value.map((p) =>
        p.id === dialog.id ? res.data : p,
      );
      dialogProduct.value = res.data as Product;
    }

    dialog.open = false;
  } catch (e: any) {
    const resp = e?.response?.data;
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
      formErrors.global = "حدث خطأ أثناء حفظ المنتج.";
    }
  } finally {
    savingProduct.value = false;
  }
};

watch(
  () => [dialog.open, dialogTab.value, activeDialogProduct.value?.id] as const,
  async ([open, tab, id]) => {
    if (!open) return;
    if (!id) return;
    const p = activeDialogProduct.value;
    if (!p) return;

    if (tab === "variants") {
      currentProductForVariants.value = p;
      await fetchVariants(p.id);
    }
    if (tab === "images") {
      currentProductForImages.value = p;
      await fetchImages(p.id);
    }
  },
);
async function quickCreateBrand() {
  const vendorId = resolveVendorForOptions(form.vendor_id);
  if (!vendorId) {
    alert("يرجى اختيار المحل أولاً");
    return;
  }
  const name = window.prompt("اسم البراند الجديد:");
  if (!name) return;
  try {
    const fd = new FormData();
    fd.append("vendor_id", String(vendorId));
    fd.append("name", name.trim());
    const res = await axiosInstance.post("v1/admin/brands", fd);
    await fetchBrands(vendorId);
    form.brand_id = Number(res.data?.id) || form.brand_id;
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر إضافة البراند");
  }
}

async function quickCreateCategory() {
  const vendorId = resolveVendorForOptions(form.vendor_id);
  if (!vendorId) {
    alert("يرجى اختيار المحل أولاً");
    return;
  }
  const name = window.prompt("اسم القسم الجديد:");
  if (!name) return;
  try {
    const fd = new FormData();
    fd.append("vendor_id", String(vendorId));
    fd.append("name", name.trim());
    const res = await axiosInstance.post("v1/admin/categories", fd);
    await fetchCategories(vendorId);
    const id = Number(res.data?.id) || 0;
    if (id > 0 && !form.category_ids.includes(id)) {
      form.category_ids.push(id);
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || "تعذر إضافة القسم");
  }
}

const confirmDelete = async (p: Product) => {
  if (!window.confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`)) return;
  try {
    await axiosInstance.delete(`v1/admin/products/${p.id}`);
    products.value = products.value.filter((x) => x.id !== p.id);
  } catch (e) {
    console.error("Failed to delete product", e);
  }
};

const firstVariantPrice = (p: Product): number | null => {
  const first = p.variants?.[0];
  if (!first || first.price == null) return null;
  return Number(first.price);
};

const formatPrice = (val: number | null): string => {
  if (val == null) return "-";
  const decimals = Math.floor(val) !== val ? 2 : 0;
  return val.toFixed(decimals);
};

// Variants state
const currentProductForVariants = ref<Product | null>(null);
const variants = ref<Variant[]>([]);
const editingVariant = ref<Variant | null>(null);
const variantError = ref<string | null>(null);
const variantForm = ref<{
  type: "color" | "size";
  sku: string;
  color: string;
  size: string;
  price: string;
  stock: string;
  is_active: boolean;
  properties: Array<{ key: string; value: string }>;
}>({
  type: "color",
  sku: "",
  color: "",
  size: "",
  price: "",
  stock: "",
  is_active: true,
  properties: [],
});

async function fetchVariants(productId: number) {
  try {
    const res = await axiosInstance.get(
      `v1/admin/products/${productId}/variants`,
    );
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    variants.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Failed to fetch variants", e);
    variantError.value = "فشل في جلب الخصائص.";
  }
}

function resetVariantForm() {
  editingVariant.value = null;
  variantForm.value = {
    type: "color",
    sku: "",
    color: "",
    size: "",
    price: "",
    stock: "",
    is_active: true,
    properties: [],
  };
}

function startEditVariant(v: Variant) {
  editingVariant.value = v;
  const inferredType: "color" | "size" =
    v.color && !v.size ? "color" : v.size && !v.color ? "size" : "color";
  variantForm.value = {
    type: inferredType,
    sku: v.sku,
    color: v.color ?? "",
    size: v.size ?? "",
    price: v.price != null ? String(v.price) : "",
    stock: v.stock != null ? String(v.stock) : "",
    is_active: v.is_active,
    properties: Object.entries(v.properties ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  };
}

function addProperty() {
  variantForm.value.properties.push({ key: "", value: "" });
}

function removeProperty(idx: number) {
  variantForm.value.properties.splice(idx, 1);
}

async function submitVariant() {
  if (!currentProductForVariants.value) return;
  variantError.value = null;
  try {
    const propsObj: Record<string, string> = {};
    variantForm.value.properties.forEach((p) => {
      if (p.key) {
        propsObj[p.key] = p.value;
      }
    });

    const color =
      variantForm.value.type === "color"
        ? variantForm.value.color || null
        : null;
    const size =
      variantForm.value.type === "size"
        ? variantForm.value.size || null
        : null;

    const payload: any = {
      sku: variantForm.value.sku,
      color,
      size,
      price:
        variantForm.value.price !== ""
          ? parseFloat(variantForm.value.price)
          : null,
      stock:
        variantForm.value.stock !== ""
          ? parseInt(variantForm.value.stock)
          : null,
      is_active: variantForm.value.is_active ? 1 : 0,
      properties: Object.keys(propsObj).length ? JSON.stringify(propsObj) : null,
    };

    const productId = currentProductForVariants.value.id;

    if (editingVariant.value) {
      await axiosInstance.put(
        `v1/admin/products/${productId}/variants/${editingVariant.value.id}`,
        payload,
      );
    } else {
      await axiosInstance.post(
        `v1/admin/products/${productId}/variants`,
        payload,
      );
    }

    await fetchVariants(productId);
    resetVariantForm();
  } catch (e: any) {
    console.error("Failed to save variant", e);
    const resp = e?.response?.data;
    if (resp?.errors) {
      const all = Object.values(resp.errors as any)
        .flat()
        .map((x: any) => String(x));
      variantError.value = all.join("\n");
    } else if (resp?.message) {
      variantError.value = String(resp.message);
    } else {
      variantError.value = "حدث خطأ أثناء حفظ الخاصية.";
    }
  }
}

async function deleteVariant(v: Variant) {
  if (!currentProductForVariants.value) return;
  if (!window.confirm("هل أنت متأكد من حذف هذه الخاصية؟")) return;
  try {
    const productId = currentProductForVariants.value.id;
    await axiosInstance.delete(
      `v1/admin/products/${productId}/variants/${v.id}`,
    );
    await fetchVariants(productId);
  } catch (e) {
    console.error("Failed to delete variant", e);
    variantError.value = "فشل في حذف الخاصية.";
  }
}

// Images state
const currentProductForImages = ref<Product | null>(null);
const images = ref<ProductImage[]>([]);
const editingImage = ref<ProductImage | null>(null);
const imageError = ref<string | null>(null);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const imageForm = ref<{ sort_order: number }>({ sort_order: 0 });

async function fetchImages(productId: number) {
  try {
    const res = await axiosInstance.get(
      `v1/admin/products/${productId}/images`,
    );
    const list = Array.isArray(res.data) ? res.data : res.data?.data;
    images.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Failed to fetch images", e);
    imageError.value = "فشل في جلب الصور.";
  }
}

function startEditImage(img: ProductImage) {
  editingImage.value = img;
  imageForm.value.sort_order = img.sort_order;
  imageFile.value = null;
  imagePreview.value = img.url;
}

function onImageFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  imageFile.value = file;
  imagePreview.value = file ? URL.createObjectURL(file) : null;
}

function resetImageForm() {
  editingImage.value = null;
  imageForm.value = { sort_order: 0 };
  imageFile.value = null;
  imagePreview.value = null;
}

async function submitImage() {
  if (!currentProductForImages.value) return;
  imageError.value = null;
  try {
    const fd = new FormData();
    if (imageFile.value) {
      fd.append("image", imageFile.value);
    }
    fd.append("sort_order", String(imageForm.value.sort_order ?? 0));

    const config = {
      headers: { "Content-Type": "multipart/form-data" },
    };

    const productId = currentProductForImages.value.id;

    if (editingImage.value) {
      await axiosInstance.post(
        `v1/admin/products/${productId}/images/${editingImage.value.id}`,
        fd,
        config,
      );
    } else {
      await axiosInstance.post(
        `v1/admin/products/${productId}/images`,
        fd,
        config,
      );
    }

    await fetchImages(productId);
    resetImageForm();
  } catch (e: any) {
    console.error("Failed to save image", e);
    const resp = e?.response?.data;
    if (resp?.errors) {
      const all = Object.values(resp.errors as any)
        .flat()
        .map((x: any) => String(x));
      imageError.value = all.join("\n");
    } else if (resp?.message) {
      imageError.value = String(resp.message);
    } else {
      imageError.value = "حدث خطأ أثناء حفظ الصورة.";
    }
  }
}

async function deleteImage(img: ProductImage) {
  if (!currentProductForImages.value) return;
  if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
  try {
    const productId = currentProductForImages.value.id;
    await axiosInstance.delete(
      `v1/admin/products/${productId}/images/${img.id}`,
    );
    await fetchImages(productId);
  } catch (e) {
    console.error("Failed to delete image", e);
    imageError.value = "فشل في حذف الصورة.";
  }
}

onMounted(async () => {
  await Promise.all([
    isSuperAdmin.value ? fetchVendors() : Promise.resolve(),
    fetchBrands(),
    fetchCategories(),
  ]);
  await fetchProducts();
});
</script>

