<template>
  <div class="flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
    <!-- Desktop sidebar -->
    <aside
      class="hidden md:flex flex-col shadow-lg border-l transition-all duration-200 app-panel sidebar-root"
      :class="sidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <div class="flex items-center justify-between px-3 py-3 border-b app-border">
        <div
          v-if="!sidebarCollapsed"
          class="flex items-center gap-2"
        >
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-2xl shadow-sm">
            <span class="text-white w-6 h-6 text-lg font-bold leading-none">₵</span>
          </div>
          <div class="leading-tight">
            <h1 class="text-sm font-bold text-blue-900 dark:text-slate-50">
              كاشير المودة
            </h1>
            <p class="text-[11px] text-gray-500 app-text-muted">
              لوحة تحكم متقدمة للمبيعات
            </p>
          </div>
        </div>
        <button
          class="rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 w-7 h-7 flex items-center justify-center text-xs"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <span v-if="sidebarCollapsed">»</span>
          <span v-else>«</span>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div
          v-for="group in groupedMenu"
          :key="group.id"
          class="mb-1"
        >
          <button
            class="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 px-2 py-1 rounded hover:bg-gray-50"
            @click="toggleGroup(group.id)"
          >
            <span v-if="!sidebarCollapsed">{{ group.label }}</span>
            <span v-else>•</span>
            <span
              v-if="!sidebarCollapsed"
              class="text-[9px] text-gray-400"
            >
              {{ expandedGroups[group.id] ? "إخفاء" : "إظهار" }}
            </span>
          </button>
          <div
            v-if="expandedGroups[group.id]"
            class="space-y-0.5 mt-1"
          >
            <button
              v-for="item in group.items"
              :key="item.key"
              :class="[
                'w-full flex items-center gap-3 text-[15px] px-3 py-2 rounded-md transition',
                activePage === item.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-blue-50'
              ]"
              @click="activePage = item.key"
            >
              <span class="w-5 h-5 text-center text-lg">
                {{ menuIcons[item.key] || "•" }}
              </span>
              <span
                v-if="!sidebarCollapsed"
                class="leading-none"
              >
                {{ item.label }}
              </span>
            </button>
          </div>
        </div>
      </nav>
      <div class="p-3 border-t">
        <button
          class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center text-xs shadow-sm"
          @click="handleLogout"
        >
          <span class="w-4 h-4 ml-2">⎋</span>
          <span v-if="!sidebarCollapsed">تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <!-- Mobile navbar -->
    <header
      class="md:hidden flex items-center justify-between px-4 py-2 shadow-lg z-20 border-b w-full app-panel"
    >
      <button
        class="text-blue-800 text-2xl"
        @click="mobileSidebarOpen = true"
      >
        ☰
      </button>
      <div class="font-bold text-sm text-blue-800 dark:text-slate-50">
        كاشير المودة
      </div>
      <button
        class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-full"
        @click="handleLogout"
      >
        خروج
      </button>
    </header>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-30 flex md:hidden"
    >
      <!-- Sidebar panel -->
      <div
        class="flex flex-col w-full max-w-xs h-full shadow-xl border-l app-panel sidebar-root"
      >
        <div class="flex items-center justify-between p-4 border-b app-border">
          <div class="flex items-center gap-2">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-2xl shadow-sm">
              <span class="text-white w-6 h-6 text-lg font-bold leading-none">₵</span>
            </div>
            <div class="leading-tight">
              <h1 class="text-sm font-bold text-blue-800">كاشير المودة</h1>
              <p class="text-[10px] text-gray-500">إدارة ذكية للمبيعات</p>
            </div>
          </div>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="mobileSidebarOpen = false"
          >
            ✕
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto p-2 space-y-1">
          <div
            v-for="group in groupedMenu"
            :key="group.id"
            class="mb-1"
          >
            <button
              class="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 px-2 py-1"
              @click="toggleGroup(group.id)"
            >
              <span>{{ group.label }}</span>
              <span class="text-[10px]">
                {{ expandedGroups[group.id] ? "−" : "+" }}
              </span>
            </button>
            <div
              v-if="expandedGroups[group.id]"
              class="space-y-0.5 mt-1"
            >
              <button
                v-for="item in group.items"
                :key="item.key"
                :class="[
                  'w-full flex items-center gap-3 text-[15px] px-3 py-2 rounded hover:bg-blue-50',
                  activePage === item.key ? 'bg-blue-600 text-white' : 'text-gray-700'
                ]"
                @click="() => { activePage = item.key; mobileSidebarOpen = false; }"
              >
                <span class="w-5 h-5 text-center text-lg">
                  {{ menuIcons[item.key] || "•" }}
                </span>
                <span class="leading-none">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
      <!-- Backdrop -->
      <div
        class="flex-1 bg-black/40"
        @click="mobileSidebarOpen = false"
      ></div>
    </div>

    <!-- Main content -->
    <main
      class="flex-1 overflow-y-auto p-4 md:p-6 app-shell"
    >
      <!-- Top utility bar: profile, logout, font size -->
      <div
        class="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between"
      >
        <!-- User summary -->
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
          >
            {{ userInitials }}
          </div>
          <div class="leading-tight">
            <div class="text-xs font-semibold text-gray-900">
              {{ userDisplayName }}
            </div>
            <div class="text-[10px] text-gray-500">
              {{ userRoleLabel }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-wrap items-center justify-end gap-2 text-[11px] text-gray-600"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-full border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 flex items-center gap-1 text-[11px]"
            @click="activePage = 'profile'"
          >
            <span>👤</span>
            <span>الملف الشخصي</span>
          </button>

          <button
            type="button"
            class="px-3 py-1.5 rounded-full border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1 text-[11px]"
            @click="handleLogout"
          >
            <span>⎋</span>
            <span>تسجيل الخروج</span>
          </button>

          <div
            class="topbar-control"
          >
            <button
              class="topbar-control__btn topbar-control__btn--accent"
              type="button"
              @click="toggleTheme"
              :title="themeTooltip"
            >
              🌙
            </button>
            <span class="hidden sm:inline mr-1">حجم النص</span>
            <button
              class="topbar-control__btn"
              type="button"
              @click="decreaseFont"
            >
              −
            </button>
            <span class="topbar-control__value">
              {{ fontScale }}%
            </span>
            <button
              class="topbar-control__btn"
              type="button"
              @click="increaseFont"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
// @ts-ignore vue component default export is provided by .d.ts shim
import SalesInterface from "@/components/SalesInterface.vue";
// @ts-ignore
import ProductManagement from "@/components/ProductManagement.vue";
// @ts-ignore
import PurchaseInvoices from "@/components/PurchaseInvoices.vue";
// @ts-ignore
import SalesInvoices from "@/components/SalesInvoices.vue";
// @ts-ignore
import OrdersPage from "@/components/OrdersPage.vue";
// @ts-ignore
import ReportsSection from "@/components/ReportsSection.vue";
// @ts-ignore
import UserProfilePage from "@/components/UserProfilePage.vue";
// @ts-ignore
import ShopManagement from "@/components/ShopManagement.vue";
// @ts-ignore
import UsersPage from "@/components/UsersPage.vue";
// @ts-ignore
import EmployeeWalletsPage from "@/components/EmployeeWalletsPage.vue";
// @ts-ignore
import DeliveryWalletPage from "@/components/DeliveryWalletPage.vue";
// @ts-ignore
import SubscriptionPlans from "@/components/SubscriptionPlans.vue";
// @ts-ignore
import VendorSubscriptionRequests from "@/components/VendorSubscriptionRequests.vue";
// @ts-ignore
import SlidersPage from "@/components/SlidersPage.vue";
// @ts-ignore
import BrandsPage from "@/components/BrandsPage.vue";
// @ts-ignore
import CategoriesPage from "@/components/CategoriesPage.vue";
// @ts-ignore
import GovernoratesPage from "@/components/GovernoratesPage.vue";
// @ts-ignore
import ShippingFeesPage from "@/components/ShippingFeesPage.vue";
// @ts-ignore
import SocialSettingsPage from "@/components/SocialSettingsPage.vue";
// @ts-ignore
import AppThemesPage from "@/components/AppThemesPage.vue";
// @ts-ignore
import OffersPage from "@/components/OffersPage.vue";
// @ts-ignore
import ReviewsPage from "@/components/ReviewsPage.vue";
// @ts-ignore
import PreparationOrdersPage from "@/components/PreparationOrdersPage.vue";

const auth = useAuthStore();
const router = useRouter();

const user = computed(() => auth.user);
const activePage = ref<string>("sales");
const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);

// Global font scale (percentage). This affects the root html font-size so all rem-based text scales.
const getInitialFontScale = (): number => {
  if (typeof window === "undefined") return 100;
  const stored = window.localStorage.getItem("ui-font-scale");
  const parsed = stored ? Number.parseInt(stored, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 80 && parsed <= 130 ? parsed : 100;
};

const fontScale = ref<number>(getInitialFontScale());

const userDisplayName = computed(
  () => user.value?.name || user.value?.username || "—",
);

const userInitials = computed(() => {
  const n = user.value?.name || user.value?.username || "";
  if (!n) return "؟";
  const parts = n.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last).toUpperCase();
});

const theme = ref<"light" | "dark">("light");

const themeTooltip = computed(() =>
  theme.value === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن",
);

const menuItems = [
  { key: "sales", label: "نقطة البيع", permission: "نقطة البيع" },
  { key: "products", label: "تعريف المنتجات", permission: "تعريف المنتجات" },
  { key: "invoices", label: "فواتير الشراء", permission: "فواتير الشراء" },
  { key: "sales-invoices", label: "فواتير المبيعات", permission: "فواتير المبيعات" },
  { key: "orders", label: "طلبات المتجر", permission: "فواتير المبيعات" },
  { key: "preparation-orders", label: "تجهيز طلبات مودن (اليوم)", permission: "prepare orders" },
  { key: "reports", label: "التقارير", permission: "التقارير" },
  { key: "subscription-plans", label: "خطط الاشتراك", permission: "خطط الاشتراك" },
  { key: "vendor-subscription-requests", label: "طلبات الاشتراك", permission: "طلبات الاشتراك" },
  { key: "sliders", label: "الإعلانات", permission: "تعريف المنتجات" },
  { key: "brands", label: "البراندات", permission: "تعريف المنتجات" },
  { key: "categories", label: "الأقسام", permission: "تعريف المنتجات" },
  { key: "shops", label: "المحلات", permission: "إدارة المحلات" },
  { key: "users", label: "المستخدمين", permission: "المستخدمين" },
  { key: "employee-wallets", label: "محافظ الموظفين", permission: "المستخدمين" },
  { key: "delivery-wallet", label: "محفظة التوصيل", permission: "محفظة التوصيل" },
  { key: "profile", label: "الملف الشخصي", permission: null },
  // Super-admin only configuration items
  { key: "governorates", label: "المحافظات", permission: "تعريف المنتجات" },
  { key: "shipping-fees", label: "أسعار التوصيل", permission: "تعريف المنتجات" },
  { key: "social-settings", label: "روابط التواصل", permission: "تعريف المنتجات" },
  { key: "app-themes", label: "ثيم التطبيق", permission: "تعريف المنتجات" },
  { key: "offers", label: "العروض", permission: "تعريف المنتجات" },
  { key: "reviews", label: "التقييمات", permission: "تعريف المنتجات" },
];

const isSuperAdmin = computed(() => !user.value?.vendor_id);
const isVendorAdmin = computed(
  () => !!user.value?.vendor_id && user.value?.role === "vendor"
);

const userRoleLabel = computed(() => {
  if (!user.value) return "—";
  if (!user.value.vendor_id) return "مشرف عام";
  return user.value.role ? `مستخدم (${user.value.role})` : "مستخدم المحل";
});

const hasPermission = (perm: string | null) =>
  !perm || isSuperAdmin.value || user.value?.permissions?.includes(perm);

const filteredMenuItems = computed(() =>
  menuItems.filter((item) => {
    if (!item.permission) {
      return true;
    }
    // Users page accessible to vendor admins or permission holders
    if (item.key === "users" || item.key === "employee-wallets" || item.key === "delivery-wallet") {
      return hasPermission(item.permission) || isVendorAdmin.value;
    }

    // Sliders and configuration pages are managed only by the super admin
    if (
      item.key === "sliders" ||
      item.key === "governorates" ||
      item.key === "shipping-fees" ||
      item.key === "social-settings" ||
      item.key === "app-themes" ||
      item.key === "offers" ||
      item.key === "reviews"
    ) {
      return isSuperAdmin.value;
    }

    return hasPermission(item.permission);
  })
);

const menuIcons: Record<string, string> = {
  sales: "⏺",
  products: "📦",
  invoices: "🧾",
  "sales-invoices": "💰",
  orders: "📑",
  reports: "📊",
  "preparation-orders": "📦",
  "subscription-plans": "📅",
  "vendor-subscription-requests": "📨",
  sliders: "🖼",
  brands: "🏷",
  categories: "🗂",
  shops: "🏬",
  users: "👤",
  "employee-wallets": "💳",
  "delivery-wallet": "🚚",
  governorates: "🗺",
  "shipping-fees": "🚚",
  "social-settings": "🔗",
  "app-themes": "🎨",
  offers: "🏷",
  reviews: "⭐",
  profile: "👤",
};

const clampFontScale = (val: number) => Math.min(130, Math.max(80, val));

const setupInitialUi = () => {
  const initialScale = clampFontScale(fontScale.value || 100);
  fontScale.value = initialScale;

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.style.fontSize = `${initialScale}%`;

    const storedTheme = window.localStorage.getItem("ui-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      root.setAttribute("data-theme", storedTheme);
      theme.value = storedTheme;
    } else {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
        .matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
      window.localStorage.setItem("ui-theme", prefersDark ? "dark" : "light");
      theme.value = prefersDark ? "dark" : "light";
    }

    // apply initial palette (read from localStorage or default)
    const storedPalette =
      (window.localStorage.getItem("ui-palette") as
        | "blue"
        | "emerald"
        | "indigo"
        | "amber"
        | "rose"
        | "slate"
        | "cyan"
        | "teal"
        | "violet"
        | "orange"
        | "lime"
        | "neutral"
        | "navy"
        | "coffee"
        | "ocean"
        | "plum"
        | "sand"
        | "mint"
        | "ruby"
        | "graphite"
        | null) ?? "blue";
    const allowedPalettes = [
      "blue",
      "emerald",
      "indigo",
      "amber",
      "rose",
      "slate",
      "cyan",
      "teal",
      "violet",
      "orange",
      "lime",
      "neutral",
      "navy",
      "coffee",
      "ocean",
      "plum",
      "sand",
      "mint",
      "ruby",
      "graphite",
    ] as const;
    const paletteToUse = allowedPalettes.includes(
      storedPalette as (typeof allowedPalettes)[number],
    )
      ? storedPalette
      : "blue";
    root.setAttribute("data-palette", paletteToUse);
  }
};

onMounted(setupInitialUi);

watch(
  fontScale,
  (val) => {
    const clamped = clampFontScale(val || 100);
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = `${clamped}%`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ui-font-scale", String(clamped));
    }
  },
  { immediate: false },
);

const increaseFont = () => {
  fontScale.value = clampFontScale((fontScale.value || 100) + 5);
};

const decreaseFont = () => {
  fontScale.value = clampFontScale((fontScale.value || 100) - 5);
};

const toggleTheme = () => {
  if (typeof document === "undefined") return;
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  theme.value = next as "light" | "dark";
  if (typeof window !== "undefined") {
    window.localStorage.setItem("ui-theme", next);
  }
};

const menuGroups = [
  {
    id: "sales",
    label: "المبيعات",
    items: ["sales", "orders", "sales-invoices", "preparation-orders", "reports"],
  },
  {
    id: "catalog",
    label: "الكتالوج",
    items: ["products", "categories", "brands", "sliders", "offers", "reviews"],
  },
  {
    id: "billing",
    label: "الفواتير والاشتراكات",
    items: ["invoices", "subscription-plans", "vendor-subscription-requests"],
  },
  {
    id: "management",
    label: "إدارة النظام",
    items: ["shops", "users", "employee-wallets", "delivery-wallet", "profile"],
  },
  {
    id: "config",
    label: "الإعدادات المتقدمة",
    items: ["governorates", "shipping-fees", "social-settings", "app-themes"],
  },
];

const expandedGroups = ref<Record<string, boolean>>(
  Object.fromEntries(menuGroups.map((g) => [g.id, true])),
);

const groupedMenu = computed(() =>
  menuGroups
    .map((group) => ({
      id: group.id,
      label: group.label,
      items: filteredMenuItems.value.filter((i) =>
        group.items.includes(i.key),
      ),
    }))
    .filter((g) => g.items.length > 0),
);

const toggleGroup = (id: string) => {
  expandedGroups.value[id] = !expandedGroups.value[id];
};

const currentComponent = computed(() => {
  switch (activePage.value) {
    case "products":
      return ProductManagement;
    case "invoices":
      return PurchaseInvoices;
    case "sales-invoices":
      return SalesInvoices;
    case "orders":
      return OrdersPage;
    case "preparation-orders":
      return PreparationOrdersPage;
    case "reports":
      return ReportsSection;
    case "subscription-plans":
      return SubscriptionPlans;
    case "vendor-subscription-requests":
      return VendorSubscriptionRequests;
    case "shops":
      return ShopManagement;
    case "users":
      return UsersPage;
    case "employee-wallets":
      return EmployeeWalletsPage;
    case "delivery-wallet":
      return DeliveryWalletPage;
    case "profile":
      return UserProfilePage;
    case "brands":
      return BrandsPage;
    case "categories":
      return CategoriesPage;
    case "sliders":
      return SlidersPage;
    case "offers":
      return OffersPage;
    case "reviews":
      return ReviewsPage;
    case "governorates":
      return GovernoratesPage;
    case "shipping-fees":
      return ShippingFeesPage;
    case "social-settings":
      return SocialSettingsPage;
    case "app-themes":
      return AppThemesPage;
    default:
      return SalesInterface;
  }
});

// Keep activePage valid for the current user's permissions (important for preparation users).
const ensureActivePageIsAllowed = () => {
  const allowedKeys = filteredMenuItems.value.map((i) => i.key);
  if (!allowedKeys.length) {
    activePage.value = "profile";
    return;
  }
  if (!allowedKeys.includes(activePage.value)) {
    activePage.value = allowedKeys[0] ?? "profile";
  }
};

// Only choose a default landing page once (otherwise profile updates would force navigation).
const didSetInitialLanding = ref(false);

watch(
  () => [user.value?.role, user.value?.permissions?.join("|"), user.value?.vendor_id],
  () => {
    // If this is a preparation user, prefer the preparation page as the initial default.
    // IMPORTANT: do this only once. Profile page refreshes /me and updates the auth store,
    // which would otherwise keep forcing navigation back to preparation orders.
    const isPrep =
      (user.value?.role || "").toString().toLowerCase() === "preparation" ||
      (user.value?.permissions || []).includes("prepare orders");

    if (!didSetInitialLanding.value) {
      if (isPrep) {
        activePage.value = "preparation-orders";
      }
      didSetInitialLanding.value = true;
    }

    ensureActivePageIsAllowed();
  },
  { immediate: true },
);

const handleLogout = () => {
  auth.logout();
  router.push({ name: "login" });
};
</script>
