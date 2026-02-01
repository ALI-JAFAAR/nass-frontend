<template>
  <div class="overflow-x-auto rounded app-panel app-border table-container">
    <!-- Global search -->
    <div
      v-if="enableGlobalSearch"
      class="px-3 py-2 border-b bg-gray-50 flex items-center gap-2"
    >
      <input
        v-model="localGlobalSearch"
        type="text"
        class="border rounded px-2 py-1 text-xs w-64"
        :placeholder="globalSearchPlaceholderComputed"
      />
      <slot
        name="filters-extra"
        :global-search="localGlobalSearch"
        :column-filters="localColumnFilters"
      />
    </div>

    <table class="min-w-full text-sm border-separate border-spacing-0 table-root">
      <thead class="table-header">
        <tr v-if="enableColumnFilters">
          <th
            v-for="col in normalizedColumns"
            :key="`filter-${col.key}`"
            class="px-3 pt-2 pb-1 text-right"
          >
            <input
              v-if="isColumnFilterEnabled(col)"
              v-model="localColumnFilters[col.key]"
              type="text"
              class="border rounded px-2 py-1 text-[11px] w-full"
              :placeholder="col.filterPlaceholder ?? 'بحث...'"
            />
          </th>
        </tr>
        <tr>
          <th
            v-for="col in normalizedColumns"
            :key="col.key"
            :class="[
              'px-3 py-2 text-right text-xs font-medium table-header-cell',
              col.headerClass,
            ]"
            :style="col.width ? { width: col.width } : undefined"
          >
            <slot
              :name="`header-${col.key}`"
              :column="col"
            >
              {{ col.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td
            :colspan="normalizedColumns.length"
            class="px-3 py-4 text-center text-gray-500"
          >
            {{ loadingText }}
          </td>
        </tr>
        <tr v-else-if="!filteredItems.length">
          <td
            :colspan="normalizedColumns.length"
            class="px-3 py-4 text-center text-gray-400"
          >
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-else
          v-for="(item, index) in filteredItems"
          :key="getRowKey(item, index)"
          class="table-row border-t transition-colors"
          :class="index % 2 === 0 ? 'table-row-even' : 'table-row-odd'"
        >
          <td
            v-for="col in normalizedColumns"
            :key="col.key"
            :class="['px-3 py-2 align-middle', col.cellClass]"
          >
            <slot
              :name="`cell-${col.key}`"
              :item="item"
              :value="(item as any)[col.key]"
              :index="index"
            >
              {{ (item as any)[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

export interface BaseTableColumn {
  key: string;
  label: string;
  width?: string;
  headerClass?: string;
  cellClass?: string;
  searchable?: boolean;
  filterPlaceholder?: string;
}

type BaseTableColumnInput = BaseTableColumn | string;

const props = defineProps<{
  /**
   * You can pass either:
   * - an array of objects: [{ key: 'name', label: 'الاسم' }, ...]
   * - or a simple array of strings: ['name', 'price', ...]
   */
  columns: BaseTableColumnInput[];
  items: any[];
  loading?: boolean;
  emptyText?: string;
  loadingText?: string;
  rowKey?: string | ((item: any, index: number) => string | number);
  enableGlobalSearch?: boolean;
  enableColumnFilters?: boolean;
  /**
   * Optional explicit list of column keys to show text filters for.
   * If not provided, all columns except those with searchable:false get filters.
   */
  searchColumns?: string[];
  globalSearchPlaceholder?: string;
  globalSearch?: string;
  columnFilters?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:globalSearch", value: string): void;
  (e: "update:columnFilters", value: Record<string, string>): void;
  (e: "filters-change", payload: {
    globalSearch: string;
    columnFilters: Record<string, string>;
  }): void;
}>();

// Always show global search and column filters as requested.
const enableGlobalSearch = computed(() => true);
const enableColumnFilters = computed(() => true);

const localGlobalSearch = ref(props.globalSearch ?? "");
const localColumnFilters = ref<Record<string, string>>({
  ...(props.columnFilters ?? {}),
});

const normalizedColumns = computed<BaseTableColumn[]>(() =>
  props.columns.map((col) =>
    typeof col === "string"
      ? { key: col, label: col }
      : col,
  ),
);

watch(
  () => props.globalSearch,
  (val) => {
    if (typeof val === "string" && val !== localGlobalSearch.value) {
      localGlobalSearch.value = val;
    }
  },
);

watch(
  () => props.columnFilters,
  (val) => {
    if (val) {
      localColumnFilters.value = { ...val };
    }
  },
  { deep: true },
);

watch(
  localGlobalSearch,
  (val) => {
    emit("update:globalSearch", val);
    emit("filters-change", {
      globalSearch: val,
      columnFilters: { ...localColumnFilters.value },
    });
  },
);

watch(
  localColumnFilters,
  (val) => {
    emit("update:columnFilters", { ...val });
    emit("filters-change", {
      globalSearch: localGlobalSearch.value,
      columnFilters: { ...val },
    });
  },
  { deep: true },
);

const getRowKey = (item: any, index: number) => {
  if (typeof props.rowKey === "function") {
    return props.rowKey(item, index);
  }
  if (typeof props.rowKey === "string") {
    return item?.[props.rowKey] ?? index;
  }
  return item?.id ?? index;
};

const loadingText = computed(() => props.loadingText ?? "جار التحميل...");
const emptyText = computed(() => props.emptyText ?? "لا توجد بيانات.");

const globalSearchPlaceholderComputed = computed(
  () => props.globalSearchPlaceholder ?? "بحث عام...",
);

const searchableColumns = computed(() =>
  normalizedColumns.value.filter((c) => isColumnFilterEnabled(c)),
);

const filteredItems = computed(() => {
  let result = props.items ?? [];

  const term = localGlobalSearch.value.trim().toLowerCase();
  if (term && searchableColumns.value.length) {
    result = result.filter((item: any) =>
      searchableColumns.value.some((col) => {
        const value = (item as any)[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      }),
    );
  }

  if (enableColumnFilters.value) {
    const filters = localColumnFilters.value;
    const activeKeys = Object.keys(filters).filter((k) => {
      const v = filters[k];
      return typeof v === "string" && v.trim() !== "";
    });
    if (activeKeys.length) {
      result = result.filter((item: any) =>
        activeKeys.every((key) => {
          const col = normalizedColumns.value.find((c) => c.key === key);
          if (!col || !isColumnFilterEnabled(col)) return true;
          const value = (item as any)[key];
          if (value == null) return false;
          const filterVal = filters[key];
          if (typeof filterVal !== "string") return true;
          return String(value)
            .toLowerCase()
            .includes(filterVal.trim().toLowerCase());
        }),
      );
    }
  }

  return result;
});

const isColumnFilterEnabled = (col: BaseTableColumn): boolean => {
  if (col.searchable === false) return false;
  const keys = props.searchColumns;
  if (Array.isArray(keys) && keys.length) {
    return keys.includes(col.key);
  }
  return true;
};
</script>

