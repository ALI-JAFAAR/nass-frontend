import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import IndexPage from "@/pages/IndexPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: IndexPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to: any, _from: any, next: any) => {
  const auth = useAuthStore();
  const isLoggedIn = !!auth.user || !!localStorage.getItem("token");

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: "login" });
  } else if (to.name === "login" && isLoggedIn) {
    next({ name: "home" });
  } else {
    next();
  }
});

export default router;


