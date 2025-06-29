import { defineStore } from "pinia";
import { generatedImageService } from "@/services/generated-image.service";
import type { GeneratedImage } from "@/types/generated-image.types";
import { ref } from "vue";

export const useGeneratedImageStore = defineStore("generated-images", () => {
  const images = ref<GeneratedImage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function setDefaultImage(imageId: number) {
    try {
      return await generatedImageService.setDefault(imageId);
    } catch (err) {
      error.value = "Failed to set default image";
      throw err;
    }
  }

  async function deleteImage(imageId: number) {
    try {
      await generatedImageService.delete(imageId);
    } catch (err) {
      throw err;
    }
  }

  async function generateImage(pageId: number): Promise<GeneratedImage> {
    try {
      const data = await generatedImageService.generate(pageId);
      return data;
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Failed to create image";
      throw err;
    }
  }

  async function generateMultiple(storyId: number): Promise<GeneratedImage[]> {
    try {
      const data = await generatedImageService.generateMultiple(storyId);
      return data;
    } catch (err: any) {
      error.value =
        err?.response?.data?.message || "Failed to generate multiple images";
      throw err;
    }
  }

  return {
    images,
    loading,
    error,
    setDefaultImage,
    deleteImage,
    generateImage,
    generateMultiple,
  };
});
