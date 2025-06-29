import { api } from "./api";
import type { GeneratedVideo } from "@/types/generated-video.types";

export const generatedVideoService = {
  async getVideoStatus(videoId: number) {
    const response = await api.get<{ video: GeneratedVideo }>(
      `/generated-videos/${videoId}/status`,
    );
    return response.data;
  },

  async getStoryVideos(storyId: string) {
    const response = await api.get<{ videos: GeneratedVideo[] }>(
      `/stories/${storyId}/videos`,
    );
    return response.data;
  },

  async deleteVideo(videoId: number) {
    const response = await api.delete<{ message: string }>(
      `/generated-videos/${videoId}`,
    );
    return response.data;
  },

  async generateVideo(storyId: number) {
    const response = await api.post<{ video: GeneratedVideo }>(
      `/generated-videos/generate`,
      { storyId },
    );
    return response.data;
  },
};
