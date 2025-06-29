import { api } from "./api";
import type {
  Story,
  CreateStoryDto,
  UpdateStoryDto,
} from "../types/story.types";
import {
  GeneratedImage,
  GenerateImageDto,
} from "@/types/generated-image.types";
import { GeneratedVideo } from "@/types/generated-video.types";

export const storyService = {
  async getStories(page = 1, pageSize = 10) {
    const response = await api.get<{
      stories: Story[];
      pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    }>("/stories", {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getStory(id: number) {
    const response = await api.get<{ story: Story }>(`/stories/${id}`);
    return response.data;
  },

  async createStory(data: CreateStoryDto) {
    const response = await api.post<{ story: Story }>("/stories", data);
    return response.data;
  },

  async updateStory(id: number, data: UpdateStoryDto) {
    const response = await api.put<{ story: Story }>(`/stories/${id}`, data);
    return response.data;
  },

  async deleteStory(id: number) {
    const response = await api.delete<{ message: string }>(`/stories/${id}`);
    return response.data;
  },

  async generateImage(data: GenerateImageDto) {
    const response = await api.post<{ image: GeneratedImage }>(
      "/images/generate",
      data,
    );
    return response.data;
  },

  async generateBulkImages(storyId: string) {
    const response = await api.post<{ images: GeneratedImage[] }>(
      `/stories/${storyId}/images/generate-bulk`,
    );
    return response.data;
  },

  async getGeneratedImages(storyPageId: number) {
    const response = await api.get<{ images: GeneratedImage[] }>(
      `/stories/pages/${storyPageId}/images`,
    );
    return response.data;
  },

  async getVideoStatus(videoId: number) {
    const response = await api.get<{ video: GeneratedVideo }>(
      `/videos/${videoId}/status`,
    );
    return response.data;
  },
};
