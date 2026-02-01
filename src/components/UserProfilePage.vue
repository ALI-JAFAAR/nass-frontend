<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Heading -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-blue-900">الملف الشخصي</h2>
        <p class="text-sm text-gray-500 mt-1">
          حدّث بيانات حسابك وكلمة المرور. هذه الإعدادات خاصة بك ولا تؤثر على باقي المستخدمين.
        </p>
      </div>
    </div>

    <!-- Layout -->
    <div class="grid md:grid-cols-3 gap-6">
      <!-- Overview card -->
      <div class="md:col-span-1">
        <div class="bg-white rounded-2xl shadow-sm border p-5 space-y-4 app-panel app-border">
          <div class="flex flex-col items-center text-center space-y-3">
            <div
              class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold shadow-md"
            >
              {{ initials }}
            </div>
            <div>
              <p class="text-base font-semibold text-gray-900">
                {{ profile.name || "-" }}
              </p>
              <p class="text-xs text-gray-500">
                {{ roleLabel }}
              </p>
            </div>
          </div>

          <div class="border-t pt-4 mt-2 space-y-2 text-xs text-gray-600">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">اسم المستخدم</span>
              <span class="font-medium text-gray-900">
                {{ profile.username || "—" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">البريد الإلكتروني</span>
              <span class="font-medium text-gray-900 truncate max-w-[150px]">
                {{ profile.email || "—" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form + preferences card -->
      <div class="md:col-span-2 space-y-5">
        <div class="bg-white rounded-2xl shadow-sm border p-6 space-y-5 app-panel app-border">
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  الاسم الكامل
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                  placeholder="اكتب اسمك"
                />
                <p v-if="errors.name" class="mt-1 text-[11px] text-red-600">
                  {{ errors.name }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  اسم المستخدم
                </label>
                <input
                  v-model="form.username"
                  type="text"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                  placeholder="اسم المستخدم للدخول"
                />
                <p
                  v-if="errors.username"
                  class="mt-1 text-[11px] text-red-600"
                >
                  {{ errors.username }}
                </p>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                  placeholder="example@email.com"
                />
                <p v-if="errors.email" class="mt-1 text-[11px] text-red-600">
                  {{ errors.email }}
                </p>
              </div>
            </div>

            <div class="border-t pt-4 mt-2 space-y-4">
              <h3 class="text-sm font-semibold text-gray-900">
                تغيير كلمة المرور
              </h3>
              <p class="text-xs text-gray-500">
                اترك الحقول فارغة إذا كنت لا ترغب في تغيير كلمة المرور.
              </p>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    كلمة مرور جديدة
                  </label>
                  <input
                    v-model="form.password"
                    type="password"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <p
                    v-if="errors.password"
                    class="mt-1 text-[11px] text-red-600"
                  >
                    {{ errors.password }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    v-model="form.password_confirmation"
                    type="password"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                    placeholder="أعد كتابة كلمة المرور"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="globalMessage"
              class="text-xs rounded-lg px-3 py-2 flex items-center gap-2"
              :class="
                globalMessageType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              "
            >
              <span v-if="globalMessageType === 'success'">✓</span>
              <span v-else>⚠</span>
              <span>{{ globalMessage }}</span>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                @click="resetForm"
              >
                إعادة تعيين
              </button>
              <button
                type="submit"
                class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-60"
                :disabled="submitting"
              >
                {{ submitting ? "جاري الحفظ..." : "حفظ التغييرات" }}
              </button>
            </div>
          </form>
        </div>

        <!-- UI palette selector -->
        <div class="bg-white rounded-2xl shadow-sm border p-6 space-y-4 app-panel app-border">
          <h3 class="text-sm font-semibold text-gray-900">
            ألوان الواجهة
          </h3>
          <p class="text-xs text-gray-500">
            اختر مجموعة الألوان المفضلة لك، وسيتم تطبيقها على كامل النظام في الوضعين الفاتح والداكن.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              v-for="option in paletteOptions"
              :key="option.key"
              type="button"
              class="flex items-center gap-3 p-3 rounded-xl border text-right transition shadow-sm"
              :class="[
                currentPaletteLocal === option.key
                  ? 'border-blue-500 ring-1 ring-blue-400/50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40',
              ]"
              @click="setPalette(option.key)"
            >
              <div class="flex -space-x-2 rtl:space-x-reverse">
                <span
                  v-for="(color, idx) in option.swatch"
                  :key="idx"
                  class="inline-block w-6 h-6 rounded-full border border-white shadow-sm"
                  :style="{ backgroundColor: color }"
                />
              </div>
              <div class="flex-1">
                <p class="text-xs font-semibold text-gray-900">
                  {{ option.label }}
                </p>
                <p class="text-[10px] text-gray-500">
                  {{ option.description }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import axiosInstance from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const profile = reactive({
  name: "",
  username: "",
  email: "",
});

const form = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
  password_confirmation: "",
});

const errors = reactive<Record<string, string | null>>({
  name: null,
  username: null,
  email: null,
  password: null,
});

const submitting = ref(false);
const globalMessage = ref<string | null>(null);
const globalMessageType = ref<"success" | "error">("success");

type UiPalette =
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
  | "graphite";

const getInitialPalette = (): UiPalette => {
  if (typeof window === "undefined") return "blue";
  const stored = window.localStorage.getItem("ui-palette") as UiPalette | null;
  const allowed: UiPalette[] = [
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
  ];
  return stored && allowed.includes(stored) ? stored : "blue";
};

const paletteOptions: {
  key: UiPalette;
  label: string;
  description: string;
  swatch: string[];
}[] = [
  {
    key: "blue",
    label: "أزرق كلاسيكي",
    description: "لوحة هادئة مناسبة لمعظم الاستخدامات.",
    swatch: ["#2563eb", "#4f46e5"],
  },
  {
    key: "emerald",
    label: "أخضر زمردي",
    description: "أجواء مريحة مناسبة للشاشات الطويلة.",
    swatch: ["#059669", "#10b981"],
  },
  {
    key: "indigo",
    label: "نيلي احترافي",
    description: "طابع مؤسسي أنيق للتقارير واللوحات.",
    swatch: ["#4f46e5", "#6366f1"],
  },
  {
    key: "amber",
    label: "ذهبي دافئ",
    description: "مظهر دافئ ومشرق لبيئات العرض.",
    swatch: ["#f59e0b", "#fbbf24"],
  },
  {
    key: "rose",
    label: "وردي ناعم",
    description: "خيارات لونية مريحة ولمسات ناعمة.",
    swatch: ["#e11d48", "#fb7185"],
  },
  {
    key: "slate",
    label: "رمادي عصري",
    description: "نمط محايد واحترافي للمكاتب.",
    swatch: ["#0f172a", "#64748b"],
  },
  {
    key: "cyan",
    label: "سماوي هادئ",
    description: "درجات سماوية مناسبة للتقارير ولوحات البيانات.",
    swatch: ["#0891b2", "#06b6d4"],
  },
  {
    key: "teal",
    label: "أخضر مائل للأزرق",
    description: "لوحة مريحة للعين للجلسات الطويلة.",
    swatch: ["#0f766e", "#14b8a6"],
  },
  {
    key: "violet",
    label: "بنفسجي أنيق",
    description: "مظهر احترافي مع لمسات بنفسجية.",
    swatch: ["#7c3aed", "#8b5cf6"],
  },
  {
    key: "orange",
    label: "برتقالي نشِط",
    description: "لوحة دافئة لبيئات المبيعات والعروض.",
    swatch: ["#ea580c", "#fb923c"],
  },
  {
    key: "lime",
    label: "أخضر ليموني",
    description: "ألوان ساطعة مع تباين وضوح قوي.",
    swatch: ["#65a30d", "#a3e635"],
  },
  {
    key: "neutral",
    label: "محايد كلاسيكي",
    description: "رمادي محايد مناسب لأي بيئة عمل.",
    swatch: ["#4b5563", "#9ca3af"],
  },
  {
    key: "navy",
    label: "أزرق بحري",
    description: "تدرجات بحرية داكنة تناسب لوحات التحكم.",
    swatch: ["#1d4ed8", "#1e40af"],
  },
  {
    key: "coffee",
    label: "قهوة دافئة",
    description: "ألوان بنية دافئة للمكاتب الليلية.",
    swatch: ["#92400e", "#78350f"],
  },
  {
    key: "ocean",
    label: "محيطي بارد",
    description: "مزيج من الأزرق والأخضر بإحساس بحري.",
    swatch: ["#0f766e", "#0e7490"],
  },
  {
    key: "plum",
    label: "برقوقي فاخر",
    description: "بنفسجي داكن بلمسة فاخرة.",
    swatch: ["#7e22ce", "#a855f7"],
  },
  {
    key: "sand",
    label: "رملي ناعم",
    description: "درجات رملية دافئة مناسبة للإضاءة العالية.",
    swatch: ["#f59e0b", "#fbbf24"],
  },
  {
    key: "mint",
    label: "نعناعي ناعم",
    description: "درجات خضراء فاتحة مريحة للعين.",
    swatch: ["#10b981", "#22c55e"],
  },
  {
    key: "ruby",
    label: "ياقوتي قوي",
    description: "درجات حمراء قوية مع شخصية واضحة.",
    swatch: ["#b91c1c", "#ef4444"],
  },
  {
    key: "graphite",
    label: "جرافيت احترافي",
    description: "تدرجات رمادية داكنة وعصرية.",
    swatch: ["#111827", "#4b5563"],
  },
];

const currentPaletteLocal = ref<UiPalette>(getInitialPalette());

const initials = computed(() => {
  const n = profile.name || auth.user?.name || "";
  if (!n) return "؟";
  const parts = n.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last).toUpperCase();
});

const roleLabel = computed(() => {
  if (!auth.user) return "—";
  if (!auth.user.vendor_id) return "مشرف عام (Super Admin)";
  return auth.user.role ? `مستخدم (${auth.user.role})` : "مستخدم المحل";
});

const setPalette = (key: UiPalette) => {
  currentPaletteLocal.value = key;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-palette", key);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("ui-palette", key);
  }
};

const loadProfile = async () => {
  try {
    const res = await axiosInstance.get("v1/me");
    const u = res.data?.user ?? res.data;
    if (!u) return;

    profile.name = u.name ?? "";
    profile.username = u.username ?? "";
    profile.email = u.email ?? "";

    form.name = profile.name;
    form.username = profile.username;
    form.email = profile.email;

    // Also sync auth store so header/sidebar reflect latest name
    auth.setUser({
      ...(auth.user ?? { id: u.id }),
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      vendor_id: u.vendor_id ?? auth.user?.vendor_id ?? null,
      role: u.role ?? auth.user?.role,
      permissions: u.permissions ?? auth.user?.permissions,
    });
  } catch (e) {
    console.error("Failed to load profile", e);
  }
};

onMounted(() => {
  loadProfile();
});

const resetForm = () => {
  form.name = profile.name;
  form.username = profile.username;
  form.email = profile.email;
  form.password = "";
  form.password_confirmation = "";
  Object.keys(errors).forEach((k) => {
    // @ts-ignore
    errors[k] = null;
  });
  globalMessage.value = null;
};

const handleSubmit = async () => {
  submitting.value = true;
  globalMessage.value = null;
  Object.keys(errors).forEach((k) => {
    // @ts-ignore
    errors[k] = null;
  });

  try {
    const payload: Record<string, string> = {
      name: form.name,
      username: form.username,
      email: form.email,
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    const res = await axiosInstance.put("v1/me", payload);
    const u = res.data?.user ?? res.data;

    profile.name = u.name ?? form.name;
    profile.username = u.username ?? form.username;
    profile.email = u.email ?? form.email;

    form.password = "";
    form.password_confirmation = "";

    auth.setUser({
      ...(auth.user ?? { id: u.id }),
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      vendor_id: u.vendor_id ?? auth.user?.vendor_id ?? null,
      role: u.role ?? auth.user?.role,
      permissions: u.permissions ?? auth.user?.permissions,
    });

    globalMessageType.value = "success";
    globalMessage.value = "تم حفظ التعديلات بنجاح.";
  } catch (err: any) {
    const resp = err?.response?.data;
    if (resp?.errors) {
      Object.entries(resp.errors).forEach(([key, msgs]) => {
        const first = Array.isArray(msgs) ? msgs[0] : msgs;
        if (key in errors) {
          // @ts-ignore
          errors[key] = String(first);
        }
      });
    }
    globalMessageType.value = "error";
    globalMessage.value =
      resp?.message || "حدث خطأ أثناء حفظ البيانات، حاول مرة أخرى.";
  } finally {
    submitting.value = false;
  }
};
</script>


