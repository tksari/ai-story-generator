import { api } from "./api";
import type {
  GeneratePagesForStoryDto,
  Page,
  UpdatePageDto,
} from "../types/page.types";
import type { GeneratedImage } from "../types/generated-image.types";

export const pageService = {
  async getPages(storyId: number) {
    const response = await api.get<{ pages: Page[] }>(
      `/stories/${storyId}/pages`,
    );
    return response.data;
  },

  async createPage(
    storyId: number,
    data: { pageNumber: number; content: string },
  ) {
    const response = await api.post<{ page: Page }>(
      `/stories/${storyId}/pages`,
      { ...data },
    );
    return response.data;
  },

  async updatePage(pageId: number, data: UpdatePageDto) {
    const response = await api.put<{ page: Page }>(`/pages/${pageId}`, data);
    return response.data;
  },

  async deletePage(pageId: number) {
    const response = await api.delete<{ message: string }>(`/pages/${pageId}`);
    return response.data;
  },

  async deleteAllPages(storyId: number) {
    const response = await api.delete<{ message: string }>(
      `/stories/${storyId}/pages`,
    );
    return response.data;
  },

  async orderPages(pageId: number, newIndex: number) {
    const response = await api.put<{ message: string }>(
      `/pages/${pageId}/order`,
      { newIndex },
    );
    return response.data;
  },

  async generatePagesForStory(id: string, data: GeneratePagesForStoryDto) {
    const response = await api.post(`/stories/${id}/pages/generate`, data);
    return response.data;
  },

  async getPageImages(pageId: number) {
    const response = await api.get<{ images: GeneratedImage[] }>(
      `/pages/${pageId}/images`,
    );
    return response.data;
  },
};
