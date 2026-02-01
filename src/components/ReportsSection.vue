<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="shadow-lg rounded-2xl border border-blue-100 bg-white/80">
      <div class="px-4 py-3 border-b">
        <h2 class="flex items-center gap-2 text-blue-800 font-semibold">
          إعدادات التقرير
        </h2>
      </div>
      <div class="p-4 space-y-4">
        <!-- Report type chips -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="r in reportOptions"
            :key="r.id"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs border transition"
            :class="
              selectedReport === r.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-50'
            "
            @click="onChangeReport(r.id)"
          >
            {{ r.label }}
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div>
            <label class="block mb-1 text-sm">من تاريخ</label>
            <input
              v-model="dateFrom"
              type="date"
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label class="block mb-1 text-sm">إلى تاريخ</label>
            <input
              v-model="dateTo"
              type="date"
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="md:col-span-2 flex items-end">
            <button
              class="w-full px-4 py-2 rounded bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md hover:opacity-90"
              @click="fetchReport"
            >
              تحديث التقرير
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="loading" class="text-center text-blue-500">
      جاري تحميل البيانات...
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg border">
        <div class="px-4 py-3 border-b">
          <h3 class="font-semibold">نتائج التقرير</h3>
        </div>
        <div class="p-4 overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th
                  v-for="key in tableHeaders"
                  :key="key"
                  class="border-b px-2 py-1 text-right"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in reportData" :key="i">
                <td
                  v-for="(value, key) in row"
                  :key="String(key)"
                  class="border-b px-2 py-1"
                >
                  {{ formatCell(String(key), value) }}
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="reportData.length === 0" class="text-center text-gray-500 py-4">
            لا توجد بيانات للعرض
          </p>
        </div>
      </div>

      <!-- KPIs + visual chart -->
      <div class="bg-white rounded-lg border">
        <div class="px-4 py-3 border-b">
          <h3 class="font-semibold">لوحة المؤشرات</h3>
        </div>
        <div class="p-4 space-y-4 text-sm">
          <!-- KPI cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              class="rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2 flex flex-col gap-1"
            >
              <span class="text-[11px] text-gray-600">عدد السجلات</span>
              <span class="text-lg font-semibold text-blue-700">
                {{ reportData.length.toLocaleString("en-US") }}
              </span>
            </div>
            <div
              class="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 flex flex-col gap-1"
            >
              <span class="text-[11px] text-gray-600">
                مجموع {{ chartKeyLabel || "القيمة" }}
              </span>
              <span class="text-lg font-semibold text-emerald-700">
                <template v-if="chartKey">
                  {{ isMoneyKey(chartKey) ? fmtMoney(kpiTotal) : kpiTotal.toLocaleString("en-US") }}
                </template>
                <template v-else> — </template>
              </span>
            </div>
            <div
              class="rounded-xl border border-purple-100 bg-purple-50/80 px-3 py-2 flex flex-col gap-1"
            >
              <span class="text-[11px] text-gray-600">
                متوسط {{ chartKeyLabel || "القيمة" }}
              </span>
              <span class="text-lg font-semibold text-purple-700">
                <template v-if="chartKey">
                  {{
                    isMoneyKey(chartKey)
                      ? fmtMoney(kpiAvg)
                      : kpiAvg.toLocaleString("en-US")
                  }}
                </template>
                <template v-else> — </template>
              </span>
            </div>
          </div>

          <!-- Charts area -->
          <div v-if="chartPoints.length" class="mt-4 space-y-6">
            <!-- Compact line chart for primary metric -->
            <div v-if="svgLinePoints" class="bg-gray-50 rounded-lg px-3 py-2">
              <h4 class="font-semibold mb-1 text-sm text-gray-800">
                مخطط خطي لـ {{ chartKeyLabel || "القيم" }}
              </h4>
              <svg viewBox="0 0 100 30" class="w-full h-20 text-blue-600">
                <polyline
                  :points="svgLinePoints"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle
                  v-for="(p, idx) in chartPoints"
                  :key="'pt-' + idx"
                  :cx="(chartPoints.length > 1 ? (idx * 100) / (chartPoints.length - 1) : 50)"
                  :cy="30 - (p.value / (maxChartValue || 1)) * 28"
                  r="1.5"
                  fill="currentColor"
                />
              </svg>
              <!-- X-axis labels for the line chart (dates or main label key) -->
              <div
                class="mt-1 flex justify-between text-[10px] text-gray-500"
                v-if="chartPoints.length"
              >
                <span
                  v-for="(p, idx) in chartPoints.slice(0, 6)"
                  :key="'lbl-' + idx"
                  class="flex-1 text-center truncate"
                  :title="p.label"
                >
                  {{ p.label }}
                </span>
              </div>
            </div>

            <!-- Two charts side by side on desktop -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Generic vertical bar chart (primary metric) -->
              <div>
                <h4 class="font-semibold mb-2 text-sm text-gray-800">
                  مخطط العمود لـ {{ chartKeyLabel || "القيم" }}
                </h4>
                <div class="h-56 flex items-end gap-2">
                  <div
                    v-for="p in chartPoints"
                    :key="p.label + String(p.value)"
                    class="flex-1 flex flex-col items-center justify-end text-[10px]"
                  >
                    <div
                      class="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-indigo-400 shadow-sm"
                      :style="{
                        height: maxChartValue
                          ? (8 + (p.value / maxChartValue) * 92) + '%'
                          : '8%',
                      }"
                    ></div>
                    <div
                      class="mt-1 w-full truncate text-center text-[10px] text-gray-700"
                      :title="p.label"
                    >
                      {{ p.label }}
                    </div>
                    <div class="text-[10px] text-gray-500">
                      <template v-if="chartKey">
                        {{
                          isMoneyKey(chartKey)
                            ? fmtMoney(p.value)
                            : p.value.toLocaleString("en-US")
                        }}
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right side: Top‑5 horizontal chart -->
              <div v-if="top5Points.length">
                <h4 class="font-semibold mb-2 text-sm text-gray-800">
                  أعلى ٥ عناصر حسب
                  {{ chartKeySecondaryLabel || chartKeyLabel || "القيمة" }}
                </h4>
                <div class="space-y-1">
                  <div
                    v-for="p in top5Points"
                    :key="p.label + String(p.value) + '-h'"
                    class="flex items-center gap-2 text-[10px]"
                  >
                    <span
                      class="w-24 truncate text-gray-700"
                      :title="p.label"
                    >
                      {{ p.label }}
                    </span>
                    <div
                      class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-emerald-400 to-green-600"
                        :style="{
                          width: maxChartValueSecondary
                            ? (p.value / maxChartValueSecondary) * 100 + '%'
                            : '4%',
                        }"
                      ></div>
                    </div>
                    <span class="w-16 text-right text-gray-600">
                      <template v-if="chartKeySecondary">
                        {{
                          isMoneyKey(chartKeySecondary)
                            ? fmtMoney(p.value)
                            : p.value.toLocaleString('en-US')
                        }}
                      </template>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Channel summary mini comparison chart (always shown for channel-sales, in addition to Top‑5) -->
          <div
            v-if="selectedReport === 'channel-sales' && channelTotals && maxChannelTotal"
            class="mt-4"
          >
            <h4 class="font-semibold mb-2 text-sm text-gray-800">
              مقارنة إجمالية بين مبيعات التطبيق ومبيعات الكاشير
            </h4>
            <div class="flex items-end gap-6 h-40">
              <div
                class="flex-1 flex flex-col items-center justify-end text-[11px]"
              >
                <div
                  class="w-10 rounded-t-md bg-gradient-to-t from-sky-500 to-sky-300 shadow-sm"
                  :style="{
                    height:
                      channelTotals.app && maxChannelTotal
                        ? (10 + (channelTotals.app / maxChannelTotal) * 90) +
                          '%'
                        : '10%',
                  }"
                ></div>
                <div class="mt-1 text-gray-700">مبيعات التطبيق</div>
                <div class="text-gray-500">
                  {{ fmtMoney(channelTotals.app) }} د.ع
                </div>
              </div>
              <div
                class="flex-1 flex flex-col items-center justify-end text-[11px]"
              >
                <div
                  class="w-10 rounded-t-md bg-gradient-to-t from-orange-500 to-amber-300 shadow-sm"
                  :style="{
                    height:
                      channelTotals.pos && maxChannelTotal
                        ? (10 + (channelTotals.pos / maxChannelTotal) * 90) +
                          '%'
                        : '10%',
                  }"
                ></div>
                <div class="mt-1 text-gray-700">مبيعات الكاشير</div>
                <div class="text-gray-500">
                  {{ fmtMoney(channelTotals.pos) }} د.ع
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="!chartPoints.length && !channelTotals"
            class="text-xs text-gray-500 text-center py-6"
          >
            لا توجد بيانات كافية لرسم مخطط لهذا التقرير.
          </p>
        </div>
      </div>
    </div>

    <!-- Detailed numeric summary at the bottom -->
    <div
      v-if="reportSummary && Object.keys(translatedSummary).length"
      class="bg-white/90 border border-blue-100 rounded-lg p-4 space-y-2 mt-4 text-sm"
    >
      <h3 class="font-semibold text-blue-800 mb-1">
        ملخص تفصيلي للتقرير الحالي
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="(item, key) in translatedSummary"
          :key="key"
          class="flex flex-col gap-0.5"
        >
          <span class="text-[11px] text-gray-600">{{ item.label }}</span>
          <span class="font-semibold text-gray-900">{{ item.formatted }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const selectedReport = ref("sales");
const dateFrom = ref("");
const dateTo = ref("");
const reportData = ref<any[]>([]);
const reportSummary = ref<any | null>(null);
const loading = ref(false);

const fmtMoney = (v: any) => {
  const num = Number(v);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const isNumericString = (v: any) =>
  typeof v === "string" && v.trim() !== "" && !isNaN(Number(v));
const isMoneyKey = (k: string) =>
  /total|amount|price|sum|revenue|cost|profit|sales|purchases|value/i.test(k);

const reportOptions = [
  { id: "sales", label: "مبيعات الكاشير" },
  { id: "purchases", label: "المشتريات" },
  { id: "profits", label: "الأرباح" },
  { id: "channel-sales", label: "قنوات المبيعات (التطبيق vs الكاشير)" },
  { id: "top-selling", label: "الأكثر مبيعاً" },
  { id: "purchased-items", label: "المنتجات المشتراة" },
  { id: "sold-items", label: "المنتجات المباعة" },
];

function onChangeReport(id: string) {
  selectedReport.value = id;
  fetchReport();
}

async function fetchReport() {
  loading.value = true;
  try {
    const response = await axiosInstance.get(
      `cashier/reports/${selectedReport.value}`,
      {
        params: {
          from: dateFrom.value || undefined,
          to: dateTo.value || undefined,
          vendor_id: auth.user?.vendor_id ?? undefined,
        },
      }
    );
    const payload = response.data;
    if (Array.isArray(payload)) {
      reportData.value = payload;
      reportSummary.value = null;
    } else {
      reportData.value = payload?.data ?? [];
      reportSummary.value = payload?.summary ?? null;
    }
  } catch (error) {
    console.error("Error fetching report data", error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchReport();
});

const tableHeaders = computed(() => {
  if (!reportData.value.length) return [];
  return Object.keys(reportData.value[0]);
});

// Collect all numeric-like keys from the first row so we can show
// different metrics in different charts (e.g. count vs amount).
const numericKeys = computed(() => getNumericKeys(reportData.value));

// Primary metric (used for KPIs + vertical bar chart)
const chartKey = computed(() => numericKeys.value[0] || "");

// Secondary metric (used for horizontal Top-5 bar chart)
const chartKeySecondary = computed(
  () => numericKeys.value[1] || numericKeys.value[0] || ""
);

const chartKeyLabel = computed(() =>
  chartKey.value ? chartKey.value.replace(/[_-]/g, " ") : ""
);

const chartKeySecondaryLabel = computed(() =>
  chartKeySecondary.value ? chartKeySecondary.value.replace(/[_-]/g, " ") : ""
);

const chartLabelKey = computed(() => {
  if (!reportData.value.length) return "";
  const first = reportData.value[0] as Record<string, any>;
  // Prefer a string-ish label key
  const candidate = Object.keys(first).find(
    (k) => typeof first[k] === "string"
  );
  return candidate || Object.keys(first)[0] || "";
});

const chartPoints = computed(() => {
  if (!chartKey.value || !chartLabelKey.value) return [] as Array<{
    label: string;
    value: number;
  }>;
  return reportData.value.map((row) => ({
    label: String((row as any)[chartLabelKey.value] ?? ""),
    value: Number((row as any)[chartKey.value] ?? 0) || 0,
  }));
});

const maxChartValue = computed(() =>
  chartPoints.value.reduce((max, p) => (p.value > max ? p.value : max), 0)
);

const kpiTotal = computed(() =>
  chartKey.value ? sumNumeric(reportData.value, chartKey.value) : 0
);

const kpiAvg = computed(() =>
  chartPoints.value.length ? kpiTotal.value / chartPoints.value.length : 0
);

// Simple SVG polyline points for a compact line chart of the primary metric
const svgLinePoints = computed(() => {
  if (!chartPoints.value.length || !maxChartValue.value) return "";
  const n = chartPoints.value.length;
  const step = n > 1 ? 100 / (n - 1) : 0;
  return chartPoints.value
    .map((p, idx) => {
      const x = idx * step;
      const y = 30 - (p.value / maxChartValue.value) * 28; // padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");
});

// Top 5 points for a secondary horizontal chart (using secondary metric)
const top5Points = computed(() => {
  if (!chartKeySecondary.value || !chartLabelKey.value) return [] as Array<{
    label: string;
    value: number;
  }>;
  const points = reportData.value.map((row) => ({
    label: String((row as any)[chartLabelKey.value] ?? ""),
    value: Number((row as any)[chartKeySecondary.value] ?? 0) || 0,
  }));
  return points
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
});

const maxChartValueSecondary = computed(() =>
  top5Points.value.reduce(
    (max, p) => (p.value > max ? p.value : max),
    0
  )
);

// Channel totals (for channel-sales report)
const channelTotals = computed(() => {
  if (selectedReport.value !== "channel-sales" || !reportSummary.value) return null;
  const s = reportSummary.value as any;
  return {
    app: Number(s.app_total_amount ?? 0),
    pos: Number(s.pos_total_amount ?? 0),
  };
});

const maxChannelTotal = computed(() => {
  if (!channelTotals.value) return 0;
  return Math.max(channelTotals.value.app, channelTotals.value.pos, 0);
});

// Arabic labels and formatting for summary block
const summaryFieldMeta: Record<
  string,
  { label: string; type: "money" | "number" }
> = {
  days: { label: "عدد الأيام", type: "number" },
  total_invoices: { label: "إجمالي الفواتير", type: "number" },
  total_amount: { label: "إجمالي المبلغ", type: "money" },
  avg_per_day: { label: "متوسط المبيعات في اليوم", type: "money" },
  total_sales: { label: "إجمالي المبيعات", type: "money" },
  total_purchases: { label: "إجمالي المشتريات", type: "money" },
  total_profit: { label: "إجمالي الأرباح", type: "money" },
  avg_profit_per_day: { label: "متوسط الربح في اليوم", type: "money" },
  app_total_orders: { label: "طلبات التطبيق", type: "number" },
  app_total_amount: { label: "مبيعات التطبيق", type: "money" },
  pos_total_sales: { label: "مبيعات الكاشير (عدد الفواتير)", type: "number" },
  pos_total_amount: { label: "مبيعات الكاشير (المبلغ)", type: "money" },
  total_orders: { label: "إجمالي الطلبات / الفواتير", type: "number" },
  total_items: { label: "إجمالي الكميات", type: "number" },
  total_revenue: { label: "إجمالي الإيرادات", type: "money" },
  total_cost: { label: "إجمالي التكلفة", type: "money" },
  total_sold: { label: "إجمالي المباعة", type: "number" },
  total_remaining: { label: "إجمالي المتبقي", type: "number" },
};

const translatedSummary = computed(() => {
  if (!reportSummary.value) return {} as Record<string, { label: string; formatted: string }>;
  const src = reportSummary.value as Record<string, any>;
  const out: Record<string, { label: string; formatted: string }> = {};
  for (const [key, raw] of Object.entries(src)) {
    const meta =
      summaryFieldMeta[key] ??
      ({
        label: key.replace(/_/g, " "),
        type: "number",
      } as const);
    const label = meta.label;
    const formatted =
      meta.type === "money"
        ? fmtMoney(raw)
        : Number(raw ?? 0).toLocaleString("en-US");
    out[key] = { label, formatted };
  }
  return out;
});

function getNumericKeys(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  const first = data[0] as Record<string, any>;
  return Object.keys(first).filter((k) => {
    const v = first[k];
    return typeof v === "number" || isNumericString(v);
  });
}

function sumNumeric(data: any[], key: string) {
  return data.reduce((sum, row) => {
    const v = row[key];
    const num = Number(v);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

function formatCell(key: string, value: any) {
  if (typeof value === "number") {
    return isMoneyKey(key) ? fmtMoney(value) : value.toLocaleString("en-US");
  }
  if (isNumericString(value) && isMoneyKey(key)) {
    return fmtMoney(value);
  }
  return String(value);
}
</script>


