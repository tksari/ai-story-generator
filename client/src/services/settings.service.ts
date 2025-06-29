import { api } from "./api";
import type { Settings } from "@/stores/settings.store";

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await api.get<Settings>("/settings");
    return response.data;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const response = await api.put<Settings>("/settings", settings);
    return response.data;
  },
};
