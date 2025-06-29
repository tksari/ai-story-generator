import { defineStore } from "pinia";
import { ref } from "vue";
import { pageService } from "@/services/page.service";
import {
  CreatePageDto,
  GeneratePagesForStoryDto,
  Page,
  UpdatePageDto,
} from "@/types/page.types";
import { EVENT_TYPES } from "@/events/event-types";
import { offEvent, onEvent } from "@/events/emitter";

export const usePagesStore = defineStore("pages", () => {
  const pages = ref<Page[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const storyPageGeneratingMap = ref<
    Record<number, { storyId: number; progress: number; isGenerating: boolean }>
  >({});

  async function fetchPages(storyId: number) {
    loading.value = true;
    error.value = null;
    try {
      const { pages: fetchedPages } = await pageService.getPages(storyId);
      pages.value = fetchedPages;
    } catch (err) {
      console.error("Error in fetchPages:", err);
      error.value = "Failed to fetch pages";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createPage(storyId: number, data: CreatePageDto) {
    loading.value = true;
    error.value = null;
    try {
      const { page } = await pageService.createPage(storyId, data);
      pages.value.push(page);
      return page;
    } catch (err) {
      error.value = "Failed to create page";
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePage(data: UpdatePageDto) {
    loading.value = true;
    error.value = null;
    try {
      const { page: updatedPage } = await pageService.updatePage(data.id, data);

      const index = pages.value.findIndex((p) => p.id === data.id);
      if (index !== -1) {
        pages.value[index] = { ...pages.value[index], ...updatedPage };
      }
      return updatedPage;
    } catch (err) {
      error.value = "Failed to update page";
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deletePage(pageId: number) {
    loading.value = true;
    error.value = null;
    try {
      await pageService.deletePage(pageId);
      pages.value = pages.value.filter((p) => p.id !== pageId);
    } catch (err) {
      error.value = "Failed to delete page";
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAllPages(storyId: number) {
    loading.value = true;
    error.value = null;
    try {
      await pageService.deleteAllPages(storyId);
      pages.value = pages.value.filter((p) => p.storyId !== storyId);
    } catch (err) {
      error.value = "Failed to delete all pages";
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function generatePagesForStory(
    id: string,
    data: GeneratePagesForStoryDto,
  ) {
    loading.value = true;
    error.value = null;
    try {
      return await pageService.generatePagesForStory(id, data);
    } catch (err) {
      console.error("Error in regenerateStory:", err);
      error.value = "Failed to regenerate story";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePageOrder(
    storyId: number,
    pageId: number,
    newIndex: number,
  ) {
    try {
      await pageService.orderPages(pageId, newIndex);

      await fetchPages(storyId);
    } catch (error) {
      console.error("Error updating page order:", error);
      throw error;
    }
  }

  function handleUpdatePageGenerating(data: {
    storyId: number;
    progress?: number;
    isGenerating?: boolean;
  }) {
    const existing = storyPageGeneratingMap.value[data.storyId] || {
      storyId: data.storyId,
      progress: 0,
      isGenerating: false,
    };

    storyPageGeneratingMap.value[data.storyId] = {
      ...existing,
      ...data,
    };
  }

  function addMultipleItemsToPageArrayField<T extends keyof Page>(
    key: T,
    items: any[],
  ) {
    const pageMap = Object.fromEntries(pages.value.map((p) => [p.id, p]));

    for (const item of items) {
      const page = pageMap[item.pageId];
      if (page && Array.isArray(page[key])) {
        page[key].unshift(item);
      }
    }
  }

  function addItemToPageArrayField<T extends keyof Page>(
    key: T,
    pageId: number,
    item: any,
  ) {
    const pageIndex = pages.value.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const items = pages.value[pageIndex]?.[key] as any[];

    if (Array.isArray(items)) {
      pages.value[pageIndex][key] = [
        item,
        ...(pages.value[pageIndex][key] as any[]),
      ] as any;
    } else {
      pages.value[pageIndex][key] = [item] as any;
    }
  }

  function removeItemFromPageArrayField<T extends keyof Page>(
    key: T,
    pageId: number,
    itemId: number,
  ) {
    const pageIndex = pages.value.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const items = pages.value[pageIndex]?.[key] as any[];

    if (Array.isArray(items)) {
      const filteredItems = items.filter((item: any) => item.id !== itemId);
      pages.value[pageIndex][key] = filteredItems as any;
    }
  }

  function updateItemInPageArrayField<T extends keyof Page>(
    key: T,
    pageId: number,
    updatedItem: any,
  ) {
    const pageIndex = pages.value.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const items = pages.value[pageIndex]?.[key] as any[];

    if (Array.isArray(items)) {
      const newItems = items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
      );
      pages.value[pageIndex][key] = newItems as any;
    }
  }

  function updateItemInPageArrayDefaultStatusField<T extends keyof Page>(
    key: T,
    pageId: number,
    updatedItem: any,
  ) {
    const pageIndex = pages.value.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const items = pages.value[pageIndex]?.[key] as any[];

    if (Array.isArray(items)) {
      const newItems = items.map((item) => ({
        ...item,
        isDefault: item.id === updatedItem.id,
      }));
      pages.value[pageIndex][key] = newItems as any;
    }
  }

  const setupStoreEvents = () => {
    onEvent(EVENT_TYPES.PAGE_GENERATING, (data) => {
      handleUpdatePageGenerating(data);
    });
    onEvent(EVENT_TYPES.IMAGE_CREATED, ({ pageId, item }) => {
      addItemToPageArrayField("generatedImages", pageId, item);
    });
    onEvent(EVENT_TYPES.IMAGE_DELETED, ({ pageId, id }) => {
      removeItemFromPageArrayField("generatedImages", pageId, id);
    });
    onEvent(EVENT_TYPES.IMAGE_UPDATE, ({ pageId, item }) => {
      updateItemInPageArrayField("generatedImages", pageId, item);
    });
    onEvent(EVENT_TYPES.IMAGE_SET_DEFAULT, ({ pageId, item }) => {
      updateItemInPageArrayDefaultStatusField("generatedImages", pageId, item);
    });
    onEvent(EVENT_TYPES.IMAGE_BULK_ADD, ({ items }) => {
      addMultipleItemsToPageArrayField("generatedImages", items);
    });
    onEvent(EVENT_TYPES.SPEECH_CREATED, ({ pageId, item }) => {
      addItemToPageArrayField("generatedSpeeches", pageId, item);
    });
    onEvent(EVENT_TYPES.SPEECH_DELETED, ({ pageId, id }) => {
      removeItemFromPageArrayField("generatedSpeeches", pageId, id);
    });
    onEvent(EVENT_TYPES.SPEECH_UPDATE, ({ pageId, item }) => {
      updateItemInPageArrayField("generatedSpeeches", pageId, item);
    });
    onEvent(EVENT_TYPES.SPEECH_BULK_ADD, ({ items }) => {
      addMultipleItemsToPageArrayField("generatedSpeeches", items);
    });
    onEvent(EVENT_TYPES.SPEECH_SET_DEFAULT, ({ pageId, item }) => {
      updateItemInPageArrayDefaultStatusField(
        "generatedSpeeches",
        pageId,
        item,
      );
    });
    onEvent(EVENT_TYPES.MEDIA_UPDATE, ({ key, pageId, item }) => {
      updateItemInPageArrayField(key, pageId, item);
    });
  };

  const cleanupStoreEvents = () => {
    offEvent(EVENT_TYPES.IMAGE_CREATED);
    offEvent(EVENT_TYPES.IMAGE_DELETED);
    offEvent(EVENT_TYPES.IMAGE_UPDATE);
    offEvent(EVENT_TYPES.IMAGE_SET_DEFAULT);
    offEvent(EVENT_TYPES.IMAGE_BULK_ADD);
    offEvent(EVENT_TYPES.SPEECH_CREATED);
    offEvent(EVENT_TYPES.SPEECH_DELETED);
    offEvent(EVENT_TYPES.SPEECH_UPDATE);
    offEvent(EVENT_TYPES.SPEECH_SET_DEFAULT);
    offEvent(EVENT_TYPES.SPEECH_BULK_ADD);
    offEvent(EVENT_TYPES.MEDIA_UPDATE);
  };

  return {
    pages,
    loading,
    error,
    storyPageGeneratingMap,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    deleteAllPages,
    setupStoreEvents,
    cleanupStoreEvents,
    updatePageOrder,
    generatePagesForStory,
  };
});
