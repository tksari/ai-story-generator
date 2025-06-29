import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { settingsService } from "@/services/settings.service";
import { ElMessage } from "element-plus";
import { getLocal, setLocal } from "@/utils/storage";

export interface Settings {
  apiBaseUrl: string;
  useFakeProvider: boolean;
  theme: "light" | "dark" | "system";
}

const DEFAULT_SETTINGS: Settings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  useFakeProvider: true,
  theme: "light",
};

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
  const isLoading = ref(false);
  const isResetting = ref(false);

  async function fetchSettings() {
    isLoading.value = true;

    try {
      const serverSettings = await settingsService.getSettings();
      if (serverSettings) {
        settings.value = { ...DEFAULT_SETTINGS, ...serverSettings };
        return;
      }

      const local = getLocal<Settings>("settings");
      if (local) {
        settings.value = { ...DEFAULT_SETTINGS, ...local };
      }
    } catch {
      const local = getLocal<Settings>("settings");
      if (local) {
        settings.value = { ...DEFAULT_SETTINGS, ...local };
      }
    } finally {
      isLoading.value = false;
      applyTheme(settings.value.theme);
    }
  }

  async function persistSettings() {
    try {
      await settingsService.updateSettings(settings.value);
      setLocal("settings", settings.value);
    } catch {
      throw new Error("Failed to save settings");
    }
  }

  async function updateSettings(newSettings: Partial<Settings>) {
    settings.value = { ...settings.value, ...newSettings };
    applyTheme(settings.value.theme);
    await persistSettings();
  }

  async function resetSettings() {
    isLoading.value = true;
    isResetting.value = true;

    settings.value = { ...DEFAULT_SETTINGS };

    await persistSettings();

    ElMessage.success("Settings have been reset");

    isLoading.value = false;
    isResetting.value = false;
  }

  function applyTheme(theme: Settings["theme"]) {
    const isDark =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : theme === "dark";

    document.documentElement.classList.toggle("dark", isDark);
  }

  watch(
    () => settings.value.theme,
    (newTheme) => {
      applyTheme(newTheme);
    },
    { immediate: true },
  );

  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (settings.value.theme === "system") {
          document.documentElement.classList.toggle("dark", e.matches);
        }
      });
  }

  return {
    settings,
    isLoading,
    fetchSettings,
    updateSettings,
    resetSettings,
  };
});
