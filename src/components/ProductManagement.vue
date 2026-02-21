<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--app-text)]">
          إدارة المنتجات
        </h1>
        <p class="mt-1 text-sm text-[var(--app-text-muted)] max-w-xl">
          إدارة كاملة للمنتجات والخصائص والصور — يتزامن مع لوحة Filament
        </p>
      </div>
      <button
        v-if="hasPermission('تعريف المنتجات')"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
        @click="openCreate"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        منتج جديد
      </button>
    </div>

    <!-- Filters -->
    <div class="rounded-2xl border bg-[var(--app-surface)] p-4 sm:p-5 shadow-sm app-border">
      <div class="flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5">بحث باسم المنتج</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="ابحث عن المنتجات..."
            class="w-full sm:w-64 border rounded-xl px-3 py-2.5 text-sm bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors app-border"
            @keyup.enter="fetchProducts"
          />
        </div>
        <div v-if="isSuperAdmin" class="min-w-[180px]">
          <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1.5">المحل</label>
          <select
            v-model.number="filters.vendorId"
            class="w-full sm:w-56 border rounded-xl px-3 py-2.5 text-sm bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors app-border"
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
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border app-border bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] transition-colors"
          @click="fetchProducts"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          تحديث
        </button>
      </div>
    </div>

    <!-- Products table -->
    <div class="rounded-2xl border overflow-hidden bg-[var(--app-surface)] shadow-sm app-border">
      <BaseTable
        :columns="productTableColumns"
        :items="filtered"
        :loading="loading"
        :enable-global-search="false"
        :enable-column-filters="false"
        empty-text="لا توجد منتجات لعرضها."
      >
        <template #cell-index="{ index }">
          <span class="text-[var(--app-text-muted)] font-medium">
            {{ (pagination.current - 1) * pagination.perPage + index + 1 }}
          </span>
        </template>

        <template #cell-first_image_url="{ item }">
          <div class="flex items-center justify-center">
            <div
              v-if="item.first_image_url"
              class="w-12 h-12 rounded-xl overflow-hidden border app-border shadow-sm flex-shrink-0"
            >
              <img
                :src="item.first_image_url"
                :alt="item.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-12 h-12 rounded-xl bg-[var(--app-surface-muted)] flex items-center justify-center text-[var(--app-text-muted)]"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </template>

        <template #cell-name="{ item }">
          <span class="font-medium text-[var(--app-text)] line-clamp-2">{{ item.name }}</span>
        </template>

        <template #cell-brand="{ item }">
          <span class="text-[var(--app-text-muted)] text-sm">{{ item.brand?.name ?? "—" }}</span>
        </template>

        <template #cell-categories="{ item }">
          <span class="max-w-[140px] truncate block text-sm text-[var(--app-text-muted)]">
            {{ item.categories?.map((c: any) => c.name).join(", ") || "—" }}
          </span>
        </template>

        <template #cell-price="{ item }">
          <span class="font-semibold text-[var(--app-text)]">{{ formatPrice(firstVariantPrice(item)) }}</span>
        </template>

        <template #cell-stock="{ item }">
          <span class="text-sm" :class="item.stock > 0 ? 'text-[var(--app-text)]' : 'text-amber-600'">
            {{ item.stock }}
          </span>
        </template>

        <template #cell-is_active="{ item }">
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
            :class="item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ item.is_active ? "مفعل" : "معطل" }}
          </span>
        </template>

        <template #cell-featured="{ item }">
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
            :class="item.featured ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ item.featured ? "مميز" : "—" }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2 justify-center">
            <button
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border app-border bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-blue-50 hover:border-blue-300 transition-colors"
              @click="openEdit(item)"
              title="تعديل"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              تعديل
            </button>
            <button
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              @click="confirmDelete(item)"
              title="حذف"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.total > pagination.perPage"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border app-border bg-[var(--app-surface)]"
    >
      <p class="text-sm text-[var(--app-text-muted)]">
        عرض <span class="font-medium text-[var(--app-text)]">{{ pagination.from }}</span>
        –
        <span class="font-medium text-[var(--app-text)]">{{ pagination.to }}</span>
        من <span class="font-medium text-[var(--app-text)]">{{ pagination.total }}</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border app-border disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors"
          :disabled="!pagination.prev"
          @click="changePage(pagination.current - 1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          السابق
        </button>
        <button
          class="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border app-border disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors"
          :disabled="!pagination.next"
          @click="changePage(pagination.current + 1)"
        >
          التالي
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Product form dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="dialog.open"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          @click.self="closeDialog"
        >
          <div
            class="bg-[var(--app-surface)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border app-border"
            dir="rtl"
          >
            <!-- Dialog header -->
            <div class="flex items-center justify-between px-6 py-4 border-b app-border bg-[var(--app-surface-muted)]/50">
              <h3 class="text-xl font-semibold text-[var(--app-text)]">
                {{ dialog.mode === "create" ? "إضافة منتج جديد" : "تعديل المنتج" }}
              </h3>
              <button
                class="p-2 rounded-xl text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] transition-colors"
                @click="closeDialog"
                aria-label="إغلاق"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Error banner -->
            <div v-if="formErrors.global" class="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
              {{ formErrors.global }}
            </div>

            <!-- Scrollable form body -->
            <div class="overflow-y-auto flex-1 px-6 py-5">

        <!-- Single scrollable form: product + variants + images -->
        <form id="product-form" class="space-y-6" @submit.prevent="submitProduct">
          <!-- Basic info -->
          <div class="space-y-4">
            <h4 class="text-sm font-semibold text-[var(--app-text)] flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-blue-500"></span>
              بيانات أساسية
            </h4>
          <div class="grid md:grid-cols-2 gap-4">
            <div v-if="isSuperAdmin">
              <label class="block mb-1.5 text-sm font-medium text-[var(--app-text-muted)]">المحل</label>
              <select
                v-model="form.vendor_id"
                class="input-field w-full"
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
            <label class="block mb-1.5 text-sm font-medium text-[var(--app-text-muted)]">اسم المنتج *</label>
            <input
                v-model="form.name"
                type="text"
                class="input-field w-full"
                placeholder="أدخل اسم المنتج"
              />
              <div v-if="formErrors.name" class="text-xs text-red-600 mt-1">{{ formErrors.name }}</div>
          </div>
          <div>
              <label class="block mb-1.5 text-sm font-medium text-[var(--app-text-muted)]">BARCODE رمز (اختياري)</label>
              <input
                v-model="form.sku"
                type="text"
                class="input-field w-full"
                placeholder="يُستخدم لجميع الخصائص إن تُركت فارغة"
              />
            </div>
            <div>
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <label class="text-sm font-medium text-[var(--app-text-muted)]">البراند</label>
                <button
                  type="button"
                  class="px-2 py-1 text-xs rounded-lg border app-border bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors"
                  @click="quickCreateBrand"
                >
                  + إضافة
                </button>
              </div>
              <select
                v-model="form.brand_id"
                class="input-field w-full"
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
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <label class="text-sm font-medium text-[var(--app-text-muted)]">الأقسام</label>
              <button
                type="button"
                class="px-2 py-1 text-xs rounded-lg border app-border bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors"
                @click="quickCreateCategory"
              >
                + إضافة
              </button>
            </div>
          <div class="relative">
            <div
              class="input-field cursor-pointer min-h-[2.5rem] flex flex-wrap gap-1.5 items-center"
              @click="categoryDropdownOpen = !categoryDropdownOpen"
            >
          <span
                v-for="id in form.category_ids"
                :key="id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {{ categoryNameById(id) }}
              </span>
              <span
                v-if="!form.category_ids.length"
                class="text-[var(--app-text-muted)] text-sm"
              >
                اختر الأقسام...
          </span>
        </div>
            <div
              v-if="categoryDropdownOpen"
              class="absolute z-20 mt-1.5 w-full bg-[var(--app-surface)] border rounded-xl shadow-lg max-h-48 overflow-y-auto app-border"
            >
              <div class="p-2 border-b app-border">
                <input
                  v-model="categorySearch"
                  type="text"
                  placeholder="بحث..."
                  class="input-field w-full text-xs"
                />
          </div>
              <div class="p-2 space-y-1">
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
            <label class="block mb-1.5 text-sm font-medium text-[var(--app-text-muted)]">الوصف</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="input-field w-full resize-none"
              placeholder="وصف اختياري للمنتج"
            ></textarea>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3 p-3 rounded-xl border app-border bg-[var(--app-surface-muted)]/30">
              <input
                id="prod-active"
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="prod-active" class="text-sm font-medium text-[var(--app-text)]">تفعيل المنتج</label>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-xl border app-border bg-[var(--app-surface-muted)]/30">
              <input
                id="prod-featured"
                v-model="form.featured"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="prod-featured" class="text-sm font-medium text-[var(--app-text)]">عرض في أحدث المنتجات</label>
            </div>
          </div>
          </div>

          <!-- Agency product -->
          <div class="rounded-xl border bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3 app-border">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.is_agency_product" type="checkbox" class="h-4 w-4" />
              <span class="text-sm font-medium">هذا المنتج من الوكالة (يمكن الشحن منه)</span>
            </label>
            <div v-if="form.is_agency_product" class="mt-2">
              <label class="block mb-1.5 text-sm font-medium text-[var(--app-text-muted)]">سعر الوكالة</label>
              <input
                v-model.number="form.agency_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="السعر الأساسي للمنتج"
                class="input-field w-full"
              />
            </div>
          </div>

          <!-- Properties key/value for product -->
          <div class="space-y-3">
            <h4 class="text-sm font-semibold text-[var(--app-text)] flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-blue-500"></span>
              خواص المنتج
            </h4>
            <div class="space-y-2">
              <div
                v-for="(pair, idx) in productProperties"
                :key="idx"
                class="flex gap-2"
              >
                <input v-model="pair.key" placeholder="المفتاح" class="input-field flex-1" />
                <input v-model="pair.value" placeholder="القيمة" class="input-field flex-1" />
                <button
                  type="button"
                  class="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  @click="removeProductProperty(idx)"
                  title="حذف"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="px-3 py-2 rounded-xl border app-border text-sm font-medium hover:bg-[var(--app-surface-muted)] transition-colors"
                @click="addProductProperty"
              >
                + إضافة خاصية
              </button>
            </div>
          </div>

          <!-- Variants section (inline) -->
          <div class="border-t pt-6 app-border">
            <h4 class="font-semibold mb-1 text-sm text-[var(--app-text)] flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-blue-500"></span>
              الخصائص (لون / حجم / سعر / مخزون)
            </h4>
            <p class="text-xs text-[var(--app-text-muted)] mb-3">
              BARCODE رمز اختياري — إن تُرك فارغاً يُستخدم رمز المنتج تلقائياً.
            </p>
            <div class="space-y-3">
              <div
                v-for="(v, idx) in formVariants"
                :key="'v-' + idx"
                class="grid grid-cols-2 md:grid-cols-6 gap-2 items-end p-4 rounded-xl border app-border bg-[var(--app-surface-muted)]/30"
              >
                <div>
                  <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1">BARCODE رمز</label>
                  <input v-model="v.sku" placeholder="اختياري" class="input-field w-full text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1">اللون</label>
                  <input v-model="v.color" class="input-field w-full text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1">الحجم</label>
                  <input v-model="v.size" class="input-field w-full text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1">السعر</label>
                  <input v-model.number="v.price" type="number" step="0.01" min="0" class="input-field w-full text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--app-text-muted)] mb-1">المخزون</label>
                  <input v-model.number="v.stock" type="number" min="0" class="input-field w-full text-sm" />
                </div>
                <div>
                  <button type="button" class="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors" @click="removeFormVariant(idx)">
                    حذف
                  </button>
                </div>
              </div>
              <button type="button" class="px-4 py-2 rounded-xl border app-border text-sm font-medium hover:bg-[var(--app-surface-muted)] transition-colors" @click="addFormVariant">
                + إضافة خاصية
              </button>
            </div>
          </div>

          <!-- Images section (create & edit) -->
          <div class="border-t pt-6 mt-6 app-border">
            <h4 class="font-semibold mb-3 text-sm text-[var(--app-text)] flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-blue-500"></span>
              صور المنتج
            </h4>

            <div v-if="imageError" class="text-red-600 text-sm mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
              {{ imageError }}
            </div>

            <!-- Drag & drop / select zone -->
            <div
              class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200"
              :class="[
                isDragOver
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'app-border hover:border-blue-400/50 bg-[var(--app-surface-muted)]/30 hover:bg-[var(--app-surface-muted)]/50',
              ]"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="onImageDrop"
            >
              <input
                ref="imageFileInputRef"
                type="file"
                accept="image/*"
                multiple
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="onImageFileChange"
              />
              <div class="pointer-events-none">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                  اسحب الصور هنا أو
                  <span class="text-blue-600 font-medium">انقر للاختيار</span>
                </p>
                <p class="mt-1 text-xs text-gray-400">PNG, JPG, WebP حتى 5 ميجا</p>
              </div>
            </div>

            <!-- Pending uploads preview -->
            <div v-if="pendingImageFiles.length > 0" class="mt-4">
              <p class="text-xs font-medium text-gray-600 mb-2">
                صور جاهزة للرفع ({{ pendingImageFiles.length }})
                <span v-if="!activeDialogProduct" class="text-amber-600 font-normal">— ستُرفع تلقائياً عند حفظ المنتج</span>
              </p>
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="(item, idx) in pendingImageFiles"
                  :key="'pending-' + idx"
                  class="relative group rounded-lg overflow-hidden border bg-white shadow-sm"
                >
                  <img :src="item.preview" alt="" class="w-20 h-20 object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      class="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                      @click.stop="removePendingImage(idx)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="p-1.5 bg-gray-50 flex items-center gap-1">
                    <label class="text-[10px] text-gray-500 whitespace-nowrap">ترتيب:</label>
                    <input
                      v-model.number="item.sort_order"
                      type="number"
                      min="0"
                      class="w-12 text-xs border rounded px-1 py-0.5"
                    />
                  </div>
                </div>
              </div>
              <button
                v-if="activeDialogProduct"
                type="button"
                class="mt-3 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                :disabled="uploadingImages"
                @click="uploadPendingImages"
              >
                {{ uploadingImages ? "جاري الرفع..." : "رفع الكل" }}
              </button>
            </div>

            <!-- Existing images gallery (edit only) -->
            <div v-if="activeDialogProduct && images.length > 0" class="mt-4">
              <p class="text-xs font-medium text-gray-600 mb-2">الصور المرفوعة</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div
                  v-for="img in images"
                  :key="img.id"
                  class="group relative rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <img :src="img.url" alt="" class="w-full aspect-square object-cover" />
                  <div class="p-2 bg-gray-50 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1 flex-1 min-w-0">
                      <label class="text-[10px] text-gray-500 shrink-0">ترتيب:</label>
                      <input
                        :value="img.sort_order"
                        type="number"
                        min="0"
                        class="w-12 text-xs border rounded px-1 py-0.5 shrink-0"
                        @change="(e) => updateImageSort(img, parseInt((e.target as HTMLInputElement).value, 10))"
                      />
                    </div>
                    <button
                      type="button"
                      class="p-1 rounded text-red-600 hover:bg-red-50"
                      title="حذف"
                      @click="deleteImage(img)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </form>
            </div>

            <!-- Dialog footer -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t app-border bg-[var(--app-surface-muted)]/30">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl border app-border text-sm font-medium hover:bg-[var(--app-surface-muted)] transition-colors"
                @click="closeDialog"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="product-form"
                class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                :disabled="savingProduct"
              >
                {{ savingProduct ? "جار الحفظ..." : "حفظ المنتج" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  is_agency_product: boolean;
  agency_price: number | null;
  category_ids: number[];
}>({
  vendor_id: null,
  brand_id: null,
  name: "",
  sku: "",
  description: "",
  is_active: true,
  featured: false,
  is_agency_product: false,
  agency_price: null,
  category_ids: [],
});

const formVariants = ref<Array<{ id?: number; sku: string; color: string; size: string; price: number; stock: number; is_active: boolean }>>([]);

function addFormVariant() {
  formVariants.value.push({
    sku: "",
    color: "",
    size: "",
    price: 0,
    stock: 0,
    is_active: true,
  });
}

function removeFormVariant(idx: number) {
  formVariants.value.splice(idx, 1);
}

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
  form.is_agency_product = false;
  form.agency_price = null;
  form.category_ids = [];
  productProperties.value = [];
  formVariants.value = [{ sku: "", color: "", size: "", price: 0, stock: 0, is_active: true }];
  resetImageForm();

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
  resetForm();
  form.vendor_id = p.vendor_id ?? null;
  form.brand_id = p.brand_id ?? null;
  form.name = p.name;
  form.sku = p.sku ?? "";
  form.description = p.description ?? "";
  form.is_active = !!p.is_active;
  form.featured = !!p.featured;
  form.is_agency_product = !!(p as any).is_agency_product;
  form.agency_price = (p as any).agency_price != null ? Number((p as any).agency_price) : null;
  form.category_ids = (p.categories ?? []).map((c) => c.id);
  formVariants.value = (p.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku ?? "",
    color: v.color ?? "",
    size: v.size ?? "",
    price: typeof v.price === "number" ? v.price : parseFloat(String(v.price)) || 0,
    stock: typeof v.stock === "number" ? v.stock : parseInt(String(v.stock), 10) || 0,
    is_active: !!v.is_active,
  }));
  if (formVariants.value.length === 0) {
    formVariants.value = [{ sku: "", color: "", size: "", price: 0, stock: 0, is_active: true }];
  }
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

  const variants = formVariants.value.map((v) => ({
    id: v.id,
    sku: v.sku?.trim() || null,
    color: v.color?.trim() || null,
    size: v.size?.trim() || null,
    price: typeof v.price === "number" ? v.price : parseFloat(String(v.price)) || 0,
    stock: typeof v.stock === "number" ? v.stock : parseInt(String(v.stock), 10) || 0,
    is_active: !!v.is_active,
  }));

  return {
    vendor_id: form.vendor_id,
    brand_id: form.brand_id,
    name: form.name,
    sku: form.sku?.trim() || null,
    description: form.description || null,
    is_active: form.is_active ? 1 : 0,
    featured: form.featured ? 1 : 0,
    is_agency_product: form.is_agency_product ? 1 : 0,
    agency_price: form.is_agency_product && form.agency_price != null ? form.agency_price : null,
    properties: Object.keys(props).length ? JSON.stringify(props) : null,
    categories: form.category_ids,
    variants: variants.length ? variants : undefined,
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

      // Upload pending images to the new product
      if (pendingImageFiles.value.length > 0) {
        currentProductForImages.value = created;
        await uploadPendingImages();
      }

      closeDialog();
      fetchProducts();
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
  () => [dialog.open, activeDialogProduct.value?.id] as const,
  async ([open, id]) => {
    if (!open || !id) return;
    const p = activeDialogProduct.value;
    if (!p) return;
    currentProductForImages.value = p;
    await fetchImages(p.id);
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
const imageError = ref<string | null>(null);
const isDragOver = ref(false);
const imageFileInputRef = ref<HTMLInputElement | null>(null);

interface PendingImage {
  file: File;
  preview: string;
  sort_order: number;
}

const pendingImageFiles = ref<PendingImage[]>([]);
const uploadingImages = ref(false);

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

function onImageDrop(e: DragEvent) {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (!files?.length) return;
  addFilesToPending(Array.from(files));
}

function onImageFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  addFilesToPending(Array.from(files));
  input.value = "";
}

function addFilesToPending(files: File[]) {
  const maxSort = Math.max(0, ...images.value.map((i) => i.sort_order), ...pendingImageFiles.value.map((p) => p.sort_order));
  let nextSort = pendingImageFiles.value.length > 0 ? maxSort + 1 : maxSort;
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  for (const file of imageFiles) {
    pendingImageFiles.value.push({
      file,
      preview: URL.createObjectURL(file),
      sort_order: nextSort++,
    });
  }
}

function removePendingImage(idx: number) {
  const item = pendingImageFiles.value[idx];
  if (item?.preview) URL.revokeObjectURL(item.preview);
  pendingImageFiles.value.splice(idx, 1);
}

async function uploadPendingImages() {
  if (!currentProductForImages.value || pendingImageFiles.value.length === 0) return;
  imageError.value = null;
  uploadingImages.value = true;
  const productId = currentProductForImages.value.id;
  const config = { headers: { "Content-Type": "multipart/form-data" } };

  try {
    for (const item of pendingImageFiles.value) {
      const fd = new FormData();
      fd.append("image", item.file);
      fd.append("sort_order", String(item.sort_order ?? 0));
      await axiosInstance.post(`v1/admin/products/${productId}/images`, fd, config);
    }
    pendingImageFiles.value.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    pendingImageFiles.value = [];
    await fetchImages(productId);
  } catch (e: any) {
    console.error("Upload failed", e);
    const resp = e?.response?.data;
    imageError.value = resp?.message ?? "حدث خطأ أثناء رفع الصور.";
  } finally {
    uploadingImages.value = false;
  }
}

async function updateImageSort(img: ProductImage, newSort: number) {
  if (!currentProductForImages.value || isNaN(newSort)) return;
  try {
    const fd = new FormData();
    fd.append("sort_order", String(newSort));
    await axiosInstance.post(
      `v1/admin/products/${currentProductForImages.value.id}/images/${img.id}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    await fetchImages(currentProductForImages.value.id);
  } catch (e) {
    console.error("Failed to update sort", e);
    imageError.value = "فشل في تحديث الترتيب.";
  }
}

function resetImageForm() {
  pendingImageFiles.value.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
  pendingImageFiles.value = [];
  imageError.value = null;
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

