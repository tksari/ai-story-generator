import { defineStore } from "pinia";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { api } from "@/services/api";

type SettingOptions = Record<string, any>;

export const useSettingOptionsStore = defineStore("settingOptions", () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const options = ref<SettingOptions>({});

  const fetchOptions = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get("/options/story");
      options.value = response.data;
    } catch (err) {
      error.value = "Failed to fetch options";
      ElMessage.error("Failed to fetch options");
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    options,
    fetchOptions,
  };
});
