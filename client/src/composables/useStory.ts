import { ref, computed } from "vue";
import { useStoryStore } from "@/stores/story.store";
import type { CreateStoryDto } from "@/types/story.types";

export function useStory() {
  const storyStore = useStoryStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  function init() {
    storyStore.setupStoreEvents();
  }

  function cleanupEvents() {
    storyStore.cleanupStoreEvents();
  }

  const story = computed(() => storyStore.currentStory);
  const stories = computed(() => storyStore.stories);
  const pagination = computed(() => storyStore.pagination);

  const fetchStories = async (page = 1, pageSize = 10) => {
    loading.value = true;
    error.value = null;
    try {
      await storyStore.fetchStories(page, pageSize);
    } catch (err) {
      error.value = "Failed to fetch stories";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchStory = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await storyStore.fetchStoryById(id);
    } catch (err) {
      error.value = "Failed to fetch story";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createStory = async (data: CreateStoryDto) => {
    loading.value = true;
    error.value = null;
    try {
      return await storyStore.createStory(data);
    } catch (err) {
      error.value = "Failed to create story";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateStory = async (id: number, data: CreateStoryDto) => {
    loading.value = true;
    error.value = null;
    try {
      return await storyStore.updateStory(id, data);
    } catch (err) {
      error.value = "Failed to update story";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteStory = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await storyStore.deleteStory(id);
    } catch (err) {
      error.value = "Failed to delete story";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    story,
    stories,
    pagination,
    loading,
    error,
    fetchStories,
    fetchStory,
    createStory,
    updateStory,
    deleteStory,
    init,
    cleanupEvents,
  };
}
