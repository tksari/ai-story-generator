import { api } from "./api";
import type { GeneratedSpeech } from "@/types/generated-speech.types";

export const generatedSpeechService = {
  async getPageSpeeches(pageId: number) {
    const response = await api.get<{ speeches: GeneratedSpeech[] }>(
      `/pages/${pageId}/speeches`,
    );
    return response.data;
  },

  async getSpeechById(speechId: number) {
    const response = await api.get<{ speech: GeneratedSpeech }>(
      `/generated-speeches/${speechId}`,
    );
    return response.data;
  },

  async setDefault(speechId: number) {
    const response = await api.post<{ message: string }>(
      `/generated-speeches/${speechId}/default`,
    );
    return response.data;
  },

  async delete(speechId: number) {
    const response = await api.delete<{ message: string }>(
      `/generated-speeches/${speechId}`,
    );
    return response.data;
  },

  async getSpeechStats(pageId: number) {
    const response = await api.get<{
      stats: { totalSpeeches: number; defaultSpeechId: number | null };
    }>(`/pages/${pageId}/speeches/stats`);
    return response.data;
  },

  async generate(pageId: number): Promise<GeneratedSpeech> {
    const response = await api.post<{ data: GeneratedSpeech }>(
      "/generated-speeches/generate",
      { pageId },
    );

    return (response as any).data;
  },

  async generateMultiple(storyId: number) {
    const response = await api.post("/generated-speeches/generate-bulk", {
      storyId,
    });
    return response.data;
  },
};
