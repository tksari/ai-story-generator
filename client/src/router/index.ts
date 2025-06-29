import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
  },
  {
    path: "/layout-editor",
    name: "layout-editor",
    component: () => import("../views/LayoutEditorView.vue"),
  },
  {
    path: "/stories",
    name: "stories",
    component: () => import("../views/stories/StoriesView.vue"),
  },
  {
    path: "/stories/:id",
    name: "story-detail",
    component: () => import("../views/stories/StoryDetailView.vue"),
    props: true,
  },
  {
    path: "/providers",
    name: "providers",
    component: () => import("../views/providers/ProvidersView.vue"),
  },
  {
    path: "/providers/:id",
    name: "provider-detail",
    component: () => import("../views/providers/ProviderDetailView.vue"),
    props: true,
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/settings/SettingsView.vue"),
  },
  {
    path: "/jobs",
    name: "jobs",
    component: () => import("../views/jobs/JobsView.vue"),
  },
  {
    path: "/request-logs",
    name: "request-logs",
    component: () => import("../views/RequestLogsView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.name
    ?.toString()
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")} - AI Story Generator`;
  next();
});

export default router;
