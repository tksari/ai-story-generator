import { defineStore } from "pinia";
import { api } from "@/services/api";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    stats: null as any | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getStats: (state) => state.stats,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchStats() {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.get("/dashboard/stats");
        this.stats = response.data;
      } catch (error) {
        this.error = "Failed to load dashboard statistics";
        console.error("Error fetching dashboard stats:", error);
      } finally {
        this.loading = false;
      }
    },
  },
});
