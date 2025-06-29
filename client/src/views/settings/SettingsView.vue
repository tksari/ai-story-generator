<template>
  <div class="settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>Settings</h2>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="settings"
        label-width="150px"
        :loading="settingsStore.isLoading"
      >
        <el-form-item label="API Base URL">
          <el-input v-model="settings.apiBaseUrl" />
        </el-form-item>
        <el-form-item label="Use Fake Provider">
          <el-switch v-model="settings.useFakeProvider" />
          <span class="ml-2">Use Fake Provider for development</span>
        </el-form-item>
        <el-form-item label="Theme">
          <el-radio-group v-model="settings.theme">
            <el-radio-button :value="'light'">Light</el-radio-button>
            <el-radio-button :value="'dark'">Dark</el-radio-button>
            <el-radio-button :value="'system'">System</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSave"
            :loading="settingsStore.isLoading"
          >
            Save Settings
          </el-button>
          <el-button @click="handleReset" :loading="settingsStore.isLoading">
            Reset to Default
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { showConfirm } from "@/utils/message-box.helper.ts";
import { useSettingsStore } from "@/stores/settings.store";
import type { Settings } from "@/stores/settings.store";

const settingsStore = useSettingsStore();
const settings = ref<Settings>({ ...settingsStore.settings });

onMounted(async () => {
  settings.value = { ...settingsStore.settings };
});

async function handleSave() {
  try {
    await settingsStore.updateSettings(settings.value);
    ElMessage.success("Settings saved successfully");
  } catch {}
}

async function handleReset() {
  try {
    await showConfirm(
      "Are you sure you want to reset all settings to default?",
      {
        title: "Warning",
        confirmButtonText: "Reset",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );
    await settingsStore.resetSettings();
    settings.value = { ...settingsStore.settings };
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("Failed to reset settings");
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
