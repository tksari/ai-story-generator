import { api } from "./api";
import type { CreateVoiceDto, UpdateVoiceDto } from "../types/provider.types";

export const voiceService = {
  async getVoicesByProviderId(providerId: number, includeInactive = false) {
    const response = await api.get(
      `/providers/${providerId}/voices?includeInactive=${includeInactive}`,
    );
    return response.data.voices;
  },

  async getVoiceById(voiceId: number) {
    const response = await api.get(`/voices/${voiceId}`);
    return response.data.voice;
  },

  async bulkCreate(providerId: number, voices: CreateVoiceDto[]) {
    const response = await api.post(`/providers/${providerId}/voices`, voices);
    return response.data;
  },

  async updateVoice(voiceId: number, data: Partial<UpdateVoiceDto>) {
    const response = await api.put(`/voices/${voiceId}`, data);
    return response.data.voice;
  },

  async deleteVoice(voiceId: number) {
    await api.delete(`/voices/${voiceId}`);
  },

  async setDefaultVoice(voiceId: number) {
    const response = await api.patch(`/voices/${voiceId}/set-default`);
    return response.data.voice;
  },
};
