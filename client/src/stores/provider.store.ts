import { defineStore } from "pinia";
import { providerService } from "../services/provider.service";
import type {
  Provider,
  CreateProviderDto,
  UpdateProviderDto,
} from "../types/provider.types";

export const useProviderStore = defineStore("provider", {
  state: () => ({
    providers: [] as Provider[],
    currentProvider: null as Provider | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeProviders: (state) => state.providers.filter((p) => p.isActive),
  },

  actions: {
    async fetchProviders(includeInactive = false) {
      this.loading = true;
      this.error = null;
      try {
        this.providers = await providerService.getAllProviders(includeInactive);
      } catch (error) {
        this.error = "Failed to fetch providers";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchProviderById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        this.currentProvider = await providerService.getProviderById(id);
        return this.currentProvider;
      } catch (error) {
        this.error = "Failed to fetch provider";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createProvider(data: CreateProviderDto) {
      this.loading = true;
      this.error = null;
      try {
        const provider = await providerService.createProvider(data);
        this.providers.push(provider);
        return provider;
      } catch (error) {
        this.error = "Failed to create provider";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProvider(id: number, data: UpdateProviderDto) {
      this.loading = true;
      this.error = null;
      try {
        const provider = await providerService.updateProvider(id, data);
        const index = this.providers.findIndex((p) => p.id === id);
        if (index !== -1) {
          this.providers[index] = provider;
        }
        if (this.currentProvider?.id === id) {
          this.currentProvider = provider;
        }
        return provider;
      } catch (error) {
        this.error = "Failed to update provider";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteProvider(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await providerService.deleteProvider(id);
        this.providers = this.providers.filter((p) => p.id !== id);
        if (this.currentProvider?.id === id) {
          this.currentProvider = null;
        }
      } catch (error) {
        this.error = "Failed to delete provider";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
