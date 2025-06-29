import { api } from "./api";
import type {
  CreateProviderDto,
  UpdateProviderDto,
} from "../types/provider.types";

export const providerService = {
  async getAllProviders(includeInactive = false) {
    const response = await api.get(
      `/providers?includeInactive=${includeInactive}`,
    );
    return response.data.providers;
  },

  async getProviderById(id: number) {
    const response = await api.get(`/providers/${id}`);
    return response.data.provider;
  },

  async createProvider(data: CreateProviderDto) {
    const response = await api.post("/providers", data);
    return response.data.provider;
  },

  async updateProvider(id: number, data: UpdateProviderDto) {
    const response = await api.put(`/providers/${id}`, data);
    return response.data.provider;
  },

  async deleteProvider(id: number) {
    await api.delete(`/providers/${id}`);
  },
};
