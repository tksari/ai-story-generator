import { defineStore } from "pinia";
import { voiceService } from "../services/voice.service";
import type {
  Voice,
  CreateVoiceDto,
  UpdateVoiceDto,
} from "../types/provider.types";

export const useVoiceStore = defineStore("voice", {
  state: () => ({
    voices: [] as Voice[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    defaultVoice: (state) => state.voices.find((v) => v.isDefault),
  },

  actions: {
    async fetchVoices(providerId: number, includeInactive = false) {
      this.loading = true;
      this.error = null;
      try {
        this.voices = await voiceService.getVoicesByProviderId(
          providerId,
          includeInactive,
        );
      } catch (error) {
        this.error = "Failed to fetch voices";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchVoiceById(voiceId: number) {
      this.loading = true;
      this.error = null;
      try {
        const voice = await voiceService.getVoiceById(voiceId);
        return voice;
      } catch (error) {
        this.error = "Failed to fetch voice";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async bulkCreate(providerId: number, voices: CreateVoiceDto[]) {
      this.loading = true;
      this.error = null;
      try {
        const result = await voiceService.bulkCreate(providerId, voices);
        return result;
      } catch (error) {
        this.error = "Failed to import voices";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateVoice(voiceId: number, data: Partial<UpdateVoiceDto>) {
      this.loading = true;
      this.error = null;
      try {
        const voice = await voiceService.updateVoice(voiceId, data);
        const index = this.voices.findIndex((v) => v.id === voiceId);
        if (index !== -1) {
          this.voices[index] = voice;
        }
        return voice;
      } catch (error) {
        this.error = "Failed to update voice";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteVoice(voiceId: number) {
      this.loading = true;
      this.error = null;
      try {
        await voiceService.deleteVoice(voiceId);
        this.voices = this.voices.filter((v) => v.id !== voiceId);
      } catch (error) {
        this.error = "Failed to delete voice";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async setDefaultVoice(voiceId: number) {
      this.loading = true;
      this.error = null;
      try {
        const voice = await voiceService.setDefaultVoice(voiceId);
        const index = this.voices.findIndex((v) => v.id === voiceId);
        if (index !== -1) {
          this.voices[index] = voice;
          this.voices = this.voices.map((v) =>
            v.id !== voiceId ? { ...v, isDefault: false } : v,
          );
        }
        return voice;
      } catch (error) {
        this.error = "Failed to set default voice";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
