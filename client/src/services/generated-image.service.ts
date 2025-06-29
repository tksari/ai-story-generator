import { api } from "./api";
import type { GeneratedImage } from "@/types/generated-image.types";

export const generatedImageService = {
  async getPageImages(pageId: number) {
    const response = await api.get<{ images: GeneratedImage[] }>(
      `/generated-images/${pageId}`,
    );
    return response.data;
  },

  async setDefault(imageId: number) {
    const response = await api.post<{ message: string }>(
      `/generated-images/${imageId}/default`,
    );
    return response.data;
  },

  async delete(imageId: number) {
    const response = await api.delete<{ message: string }>(
      `/generated-images/${imageId}`,
    );
    return response.data;
  },
  async generate(pageId: number): Promise<GeneratedImage> {
    const response = await api.post<{ data: GeneratedImage }>(
      "/generated-images/generate",
      { pageId },
    );
    return (response as any).data;
  },
  async generateMultiple(storyId: number): Promise<GeneratedImage[]> {
    const response = await api.post<{ data: { images: GeneratedImage[] } }>(
      "/generated-images/generate-bulk",
      { storyId },
    );
    return (response as any).data.images;
  },
};
