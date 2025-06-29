import { defineStore } from "pinia";
import { storyService } from "../services/story.service";
import type { Story } from "@/types/story.types";
import { CreateStoryDto, UpdateStoryDto } from "../types/story.types";
import { Page } from "@/types/page.types";
import { GeneratedImage } from "@/types/generated-image.types";
import { Pagination, TaskStatus } from "@/types/common.types";
import { GeneratedVideo } from "@/types/generated-video.types";
import { ref, computed } from "vue";
import { onEvent, offEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";
import { GeneratedSpeech } from "@/types/generated-speech.types";

export const useStoryStore = defineStore("story", () => {
  const stories = ref<Story[]>([]);
  const pagination = ref<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const pages = ref<Page[]>([]);
  const generatedImages = ref<GeneratedImage[]>([]);
  const videos = ref<GeneratedVideo[]>([]);
  const generatedSpeeches = ref<GeneratedSpeech[]>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentStory = ref<Story | null>(null);

  const completedSpeeches = computed(() =>
    generatedSpeeches.value.filter((s) => s.status === TaskStatus.DONE),
  );
  const pendingSpeeches = computed(() =>
    generatedSpeeches.value.filter((s) => s.status === TaskStatus.IN_PROGRESS),
  );
  const completedVideos = computed(() =>
    videos.value.filter((v) => v.status === TaskStatus.DONE),
  );
  const pendingVideos = computed(() =>
    videos.value.filter((v) => v.status === TaskStatus.IN_PROGRESS),
  );
  const completedImages = computed(() =>
    generatedImages.value.filter((i) => i.status === TaskStatus.DONE),
  );
  const pendingImages = computed(() =>
    generatedImages.value.filter((i) => i.status === TaskStatus.IN_PROGRESS),
  );

  async function fetchStories(page = 1, pageSize = 10) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyService.getStories(page, pageSize);
      stories.value = response.stories;
      pagination.value = response.pagination;
    } catch (err) {
      error.value = "Failed to fetch stories";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStoryById(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyService.getStory(id);
      currentStory.value = response.story;
      return response.story;
    } catch (err) {
      error.value = "Failed to fetch story";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createStory(data: CreateStoryDto) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyService.createStory(data);
      fetchStories();
      return response.story;
    } catch (err) {
      error.value = "Failed to create story";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStory(id: number, data: UpdateStoryDto) {
    loading.value = true;
    error.value = null;
    try {
      const story = await storyService.updateStory(id, data);

      const index = stories.value.findIndex((s) => s.id === Number(id));
      if (index !== -1) {
        stories.value[index] = {
          ...stories.value[index],
          ...story,
        };
      }
      if (currentStory.value?.id === Number(id)) {
        currentStory.value = { ...currentStory.value, ...story };
      }
      return story;
    } catch (err) {
      error.value = "Failed to update story";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteStory(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await storyService.deleteStory(id);
      stories.value = stories.value.filter((s) => s.id !== Number(id));
      if (currentStory.value?.id === Number(id)) {
        currentStory.value = null;
      }
    } catch (err) {
      error.value = "Failed to delete story";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVideoStatus(videoId: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyService.getVideoStatus(videoId);
      const index = videos.value.findIndex((v) => v.id === videoId);
      if (index !== -1) {
        videos.value[index] = response.video;
      }
      return response.video;
    } catch (err) {
      error.value = "Failed to fetch video status";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function removeItemFromStoryArrayField<T extends keyof Story>(
    key: T,
    id: number,
  ) {
    if (!currentStory.value) return;

    const items = currentStory.value?.[key] as any[];
    if (Array.isArray(items)) {
      (currentStory.value[key] as any[]) = items.filter(
        (item) => item.id !== id,
      );
    }
  }

  function addItemToStoryArrayField<T extends keyof Story>(key: T, item: any) {
    if (!currentStory.value) return;

    const items = currentStory.value?.[key] as any[];

    if (Array.isArray(items)) {
      currentStory.value[key] = [
        item,
        ...(currentStory.value[key] as any[]),
      ] as any;
    } else {
      currentStory.value[key] = [item] as any;
    }
  }

  function updateItemInStoryArrayField<T extends keyof Story>(
    key: T,
    updatedItem: any,
  ) {
    if (!currentStory.value) return;
    const items = currentStory.value?.[key] as any[];

    if (Array.isArray(items)) {
      const updatedItems = items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
      );

      currentStory.value[key] = updatedItems as any;
    }
  }

  const setupStoreEvents = () => {
    onEvent(EVENT_TYPES.VIDEO_DELETED, ({ id }) => {
      removeItemFromStoryArrayField("generatedVideos", id);
    });
    onEvent(EVENT_TYPES.VIDEO_CREATED, ({ video }) => {
      addItemToStoryArrayField("generatedVideos", video);
    });
    onEvent(EVENT_TYPES.VIDEO_UPDATE, ({ item }) => {
      updateItemInStoryArrayField("generatedVideos", item);
    });
    onEvent(EVENT_TYPES.STORY_SETTINGS_UPDATE, ({ settings }) => {
      if (currentStory.value) {
        currentStory.value.settings = {
          ...currentStory.value.settings,
          ...settings,
        };
      }
    });
  };

  const cleanupStoreEvents = () => {
    offEvent(EVENT_TYPES.VIDEO_DELETED);
    offEvent(EVENT_TYPES.VIDEO_CREATED);
    offEvent(EVENT_TYPES.VIDEO_UPDATE);
    offEvent(EVENT_TYPES.STORY_SETTINGS_UPDATE);
  };

  return {
    stories,
    pagination,
    pages,
    generatedImages,
    videos,
    loading,
    error,
    currentStory,
    completedSpeeches,
    pendingSpeeches,
    completedVideos,
    pendingVideos,
    completedImages,
    pendingImages,
    fetchStories,
    fetchStoryById,
    createStory,
    updateStory,
    deleteStory,
    fetchVideoStatus,
    setupStoreEvents,
    cleanupStoreEvents,
  };
});
