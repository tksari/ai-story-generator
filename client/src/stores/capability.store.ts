import { defineStore } from "pinia";
import { capabilityService } from "../services/capability.service";
import type {
  Capability,
  AddCapabilityDto,
  UpdateCapabilityDto,
} from "../types/provider.types";

export const useCapabilityStore = defineStore("capability", {
  state: () => ({
    capabilities: [] as Capability[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    defaultCapabilities: (state) =>
      state.capabilities.filter((c) => c.isDefault),
  },

  actions: {
    async fetchCapabilities(providerId: number) {
      this.loading = true;
      this.error = null;
      try {
        this.capabilities =
          await capabilityService.getCapabilitiesByProviderId(providerId);
      } catch (error) {
        this.error = "Failed to fetch capabilities";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createCapability(providerId: number, data: AddCapabilityDto) {
      this.loading = true;
      this.error = null;
      try {
        const provider = await capabilityService.createCapabilityForProvider(
          providerId,
          data,
        );
        return provider;
      } catch (error) {
        this.error = "Failed to add capability";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCapability(capabilityId: number, data: UpdateCapabilityDto) {
      this.loading = true;
      this.error = null;
      try {
        const provider = await capabilityService.updateCapabilityOfProvider(
          capabilityId,
          data,
        );
        return provider;
      } catch (error) {
        this.error = "Failed to update capability";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCapability(capabilityId: number) {
      this.loading = true;
      this.error = null;
      try {
        await capabilityService.deleteCapabilityFromProvider(capabilityId);
      } catch (error) {
        this.error = "Failed to remove capability";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
