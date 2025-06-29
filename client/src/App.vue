<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Moon, Sunny } from "@element-plus/icons-vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import { ElLoading } from "element-plus";
import { useSettingOptionsStore } from "@/stores/settingOptions";
import { socketService } from "@/services/socket.service";

const isDarkMode = ref(false);
const settingOptionsStore = useSettingOptionsStore();

function toggleTheme() {
  const html = document.documentElement;
  if (isDarkMode.value) {
    html.classList.add("dark");
    document.body.setAttribute("class", "dark");
  } else {
    html.classList.remove("dark");
    document.body.removeAttribute("class");
  }
}

onMounted(async () => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: "Loading options...",
    background: "rgba(0, 0, 0, 0.7)",
  });

  await settingOptionsStore.fetchOptions();
  loadingInstance.close();
  socketService.connect();
});

onUnmounted(() => {
  socketService.disconnect();
});
</script>

<template>
  <el-container class="app-container">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>AI Story Generator</h1>
          <div class="header-actions">
            <el-switch
              :model-value="isDarkMode"
              inline-prompt
              :active-icon="Moon"
              :inactive-icon="Sunny"
              @update:model-value="
                (val: boolean) => {
                  isDarkMode = val;
                  toggleTheme();
                }
              "
            />
          </div>
        </div>
      </el-header>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" v-if="!settingOptionsStore.isLoading" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  height: 100vh;
}

.el-aside {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}

.el-header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.el-main {
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

:root {
  --el-bg-color: #ffffff;
  --el-bg-color-page: #f2f3f5;
  --el-text-color-primary: #303133;
  --el-border-color-light: #e4e7ed;
}

.dark {
  --el-bg-color: #141414;
  --el-bg-color-page: #0a0a0a;
  --el-text-color-primary: #ffffff;
  --el-border-color-light: #434343;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
