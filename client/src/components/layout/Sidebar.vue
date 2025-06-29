<template>
  <el-menu
    :default-active="activeRoute"
    class="sidebar-menu"
    @select="handleSelect"
  >
    <el-menu-item
      v-for="item in menuItems"
      :key="item.index"
      :index="item.route"
    >
      <el-icon><component :is="item.icon" /></el-icon>
      <span>{{ item.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  HomeFilled,
  Document,
  Setting,
  VideoCamera,
  List,
  Monitor,
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();

const activeRoute = computed(() => {
  const path = route.path;
  const segments = path.split("/");
  return segments.length > 1 ? `/${segments[1]}` : path;
});

const menuItems = [
  {
    index: "1",
    icon: HomeFilled,
    title: "Dashboard",
    route: "/dashboard",
  },
  {
    index: "2",
    icon: VideoCamera,
    title: "Layout Editor",
    route: "/layout-editor",
  },
  {
    index: "3",
    icon: Document,
    title: "Stories",
    route: "/stories",
  },
  {
    index: "4",
    icon: List,
    title: "Jobs",
    route: "/jobs",
  },
  {
    index: "5",
    icon: List,
    title: "Providers",
    route: "/providers",
  },
  {
    index: "6",
    icon: Monitor,
    title: "Request Logs",
    route: "/request-logs",
  },
  {
    index: "7",
    icon: Setting,
    title: "Settings",
    route: "/settings",
  },
];

const handleSelect = (route: string) => {
  router.push(route);
};
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
