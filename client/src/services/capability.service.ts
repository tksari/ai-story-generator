import { api } from "./api";
import type {
  AddCapabilityDto,
  UpdateCapabilityDto,
} from "../types/provider.types";

export const capabilityService = {
  async getCapabilitiesByProviderId(providerId: number) {
    const response = await api.get(`/providers/${providerId}/capabilities`);
    return response.data.capabilities;
  },

  async createCapabilityForProvider(
    providerId: number,
    data: AddCapabilityDto,
  ) {
    const response = await api.post(`/providers/${providerId}/capabilities`, {
      ...data,
    });
    return response.data.provider;
  },

  async updateCapabilityOfProvider(
    capabilityId: number,
    data: UpdateCapabilityDto,
  ) {
    const response = await api.put(`/capabilities/${capabilityId}`, {
      ...data,
    });
    return response.data.provider;
  },

  async deleteCapabilityFromProvider(capabilityId: number) {
    const response = await api.delete(`capabilities/${capabilityId}`);
    return response.data;
  },
};
