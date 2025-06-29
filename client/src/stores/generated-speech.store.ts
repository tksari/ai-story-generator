import { defineStore } from "pinia";
import { generatedSpeechService } from "@/services/generated-speech.service";
import type { GeneratedSpeech } from "@/types/generated-speech.types";

export const useGeneratedSpeechStore = defineStore("generatedSpeeches", {
  state: () => ({
    speeches: [] as GeneratedSpeech[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async getSpeechesByPage(pageId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedSpeechService.getPageSpeeches(pageId);
        this.speeches = response.speeches;
        return response.speeches;
      } catch (err) {
        this.error = "Failed to fetch speeches";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async getSpeech(speechId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedSpeechService.getSpeechById(speechId);
        return response.speech;
      } catch (err) {
        this.error = "Failed to fetch speech";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async setDefaultSpeech(speechId: number) {
      this.loading = true;
      this.error = null;
      try {
        const speech = await generatedSpeechService.setDefault(speechId);
        this.speeches = this.speeches.map((speech) => ({
          ...speech,
          isDefault: speech.id === speechId,
        }));
        return speech;
      } catch (err) {
        this.error = "Failed to set default speech";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteSpeech(speechId: number) {
      this.loading = true;
      this.error = null;
      try {
        await generatedSpeechService.delete(speechId);
        this.speeches = this.speeches.filter(
          (speech) => speech.id !== speechId,
        );
      } catch (err) {
        this.error = "Failed to delete speech";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async getSpeechStats(pageId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedSpeechService.getSpeechStats(pageId);
        return response.stats;
      } catch (err) {
        this.error = "Failed to fetch speech statistics";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateSpeech(pageId: number): Promise<GeneratedSpeech> {
      this.loading = true;
      this.error = null;
      try {
        const data = await generatedSpeechService.generate(pageId);
        if (!this.speeches.some((speech) => speech.id === data.id)) {
          this.speeches.push(data);
        }
        return data;
      } catch (err: any) {
        this.error =
          err?.response?.data?.message || "Failed to generate speech";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateMultiple(storyId: number): Promise<GeneratedSpeech[]> {
      this.loading = true;
      this.error = null;
      try {
        const data = await generatedSpeechService.generateMultiple(storyId);
        data.forEach((speech: GeneratedSpeech) => {
          if (!this.speeches.some((v) => v.id === speech.id)) {
            this.speeches.push(speech);
          }
        });
        return data;
      } catch (err: any) {
        this.error =
          err?.response?.data?.message || "Failed to generate speeches";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
