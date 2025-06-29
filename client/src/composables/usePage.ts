import { ref, computed, watch } from "vue";
import { usePagesStore } from "@/stores/pages.store";
import { useGeneratedImageStore } from "@/stores/generated-image.store";
import { useGeneratedSpeechStore } from "@/stores/generated-speech.store";
import { ElMessage } from "element-plus";
import { emitEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";
import type { Page, CreatePageDto, UpdatePageDto } from "@/types/page.types";
import { showConfirm } from "@/utils/message-box.helper.ts";
import { useSocketListener } from "./useSocketListener";
import { EVENT_CHANNELS } from "@/constants/event";
import { Job } from "@/types/job.types";
import { useJobStore } from "@/stores/job.store";

const activePageJob = ref<Job | null>(null);

export function usePage(storyId: number) {
  const pagesStore = usePagesStore();
  const generatedImageStore = useGeneratedImageStore();
  const generatedSpeechStore = useGeneratedSpeechStore();
  const showAddPageModal = ref(false);
  const showEditPageModal = ref(false);
  const isInitializedLocalEvents = ref(false);
  const showDeleteModal = ref(false);
  const showAutoGenModal = ref(false);
  const selectedPage = ref<Page | null>(null);
  const pageToDelete = ref<number | null>(null);
  const autoGenPageCount = ref(1);
  const isEndStory = ref(false);
  const newPage = ref<CreatePageDto>({
    pageNumber: 1,
    content: "",
  });

  const editingPage = ref<UpdatePageDto>({
    id: 0,
    pageNumber: 1,
    content: "",
  });

  const pageGenerating = computed(
    () => pagesStore.storyPageGeneratingMap?.[storyId],
  );

  const sortedPages = computed(() => {
    if (!Array.isArray(pagesStore.pages)) return [];
    return [...pagesStore.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  });

  const handleProgress = (data: any) => {
    if (data.progress && data.storyId === storyId) {
      emitEvent(EVENT_TYPES.PAGE_GENERATING, {
        storyId: data.storyId,
        progress: data.progress,
        isGenerating: true,
      });
    }
  };

  const handleComplete = (data: any) => {
    if (data.storyId === storyId) {
      emitEvent(EVENT_TYPES.PAGE_GENERATING, {
        storyId: storyId,
        isGenerating: false,
        progress: 0,
      });
      pagesStore.fetchPages(storyId);
    }
  };

  useSocketListener({
    eventPrefix: EVENT_CHANNELS.PAGE,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onFailed: handleComplete,
  });

  async function checkActivePageGenerationJob(): Promise<void> {
    const jobStore = useJobStore();
    const job = await jobStore.getActiveJobByStoryAndType(storyId, "PAGE");
    return new Promise((resolve) => {
      if (
        job &&
        job.storyId === storyId &&
        ["PENDING", "IN_PROGRESS"].includes(job.status)
      ) {
        activePageJob.value = job;

        emitEvent(EVENT_TYPES.PAGE_GENERATING, {
          storyId,
          isGenerating: true,
        });
        setTimeout(() => {
          resolve();
        }, 10);
      } else {
        resolve();
      }
    });
  }

  const truncateContent = (content: string, maxLength: number) => {
    if (!content) return "";
    return content.length <= maxLength
      ? content
      : content.substring(0, maxLength) + "...";
  };

  const selectPage = (page: Page | null) => {
    selectedPage.value = page;
  };

  const handleAddPage = async () => {
    if (!newPage.value.content.trim()) {
      ElMessage.warning("Please enter page content");
      return;
    }

    try {
      const page = await pagesStore.createPage(storyId, {
        pageNumber: newPage.value.pageNumber,
        content: newPage.value.content,
      });
      showAddPageModal.value = false;
      newPage.value = { pageNumber: 1, content: "" };
      selectPage(page);
      ElMessage.success("Page added successfully");
    } catch (err) {
    } finally {
      showAddPageModal.value = false;
    }
  };

  const handleEdit = (page: Page) => {
    editingPage.value = {
      id: page.id,
      pageNumber: page.pageNumber,
      content: page.content,
    };
    showEditPageModal.value = true;
  };

  const handleUpdatePage = async () => {
    if (!editingPage.value.content.trim()) {
      ElMessage.warning("Please enter page content");
      return;
    }

    try {
      await pagesStore.updatePage({
        id: editingPage.value.id,
        pageNumber: editingPage.value.pageNumber,
        content: editingPage.value.content,
      });
      showEditPageModal.value = false;
      ElMessage.success("Page updated successfully");
    } catch (err) {
    } finally {
      showEditPageModal.value = false;
    }
  };

  const handleDelete = (page: Page) => {
    pageToDelete.value = page.id;
    showDeleteModal.value = true;
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete.value) return;

    try {
      await pagesStore.deletePage(pageToDelete.value);
      showDeleteModal.value = false;
      pageToDelete.value = null;
      ElMessage.success("Page deleted successfully");

      selectPage(sortedPages.value?.[0] || null);
    } catch (err) {
    } finally {
      showDeleteModal.value = false;
      pageToDelete.value = null;
    }
  };

  const handleGeneratePagesForStory = async () => {
    try {
      await pagesStore.generatePagesForStory(String(storyId), {
        type: "full",
        pageCount: autoGenPageCount.value,
        isEndStory: isEndStory.value,
      });
      emitEvent(EVENT_TYPES.PAGE_GENERATING, {
        storyId: storyId,
        isGenerating: true,
        progress: 0,
      });

      showAutoGenModal.value = false;
      selectPage(null);
      ElMessage.success("Pages generated successfully!");
    } catch (err: any) {
    } finally {
      showAutoGenModal.value = false;
    }
  };

  const handleGenerateAllImages = async () => {
    try {
      await showConfirm(
        "This will generate new images for all pages. Are you sure?",
        {
          title: "Warning",
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          type: "warning",
        },
      );

      const images = await generatedImageStore.generateMultiple(storyId);
      if (images.length > 0) {
        emitEvent(EVENT_TYPES.IMAGE_BULK_ADD, { items: images });
        ElMessage.success("Images generation started successfully");
      }
    } catch (error) {}
  };

  const handleGenerateAllSpeeches = async () => {
    try {
      await showConfirm(
        "This will generate new speeches for all pages. Are you sure?",
        {
          title: "Warning",
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          type: "warning",
        },
      );

      const speeches = await generatedSpeechStore.generateMultiple(storyId);
      if (speeches.length > 0) {
        emitEvent(EVENT_TYPES.SPEECH_BULK_ADD, { items: speeches });
        ElMessage.success("Speeches generation started successfully");
      }
    } catch (error) {}
  };

  const handleDragEnd = async (evt: { oldIndex: number; newIndex: number }) => {
    try {
      const movedPage = sortedPages.value[evt.oldIndex];

      await pagesStore.updatePageOrder(storyId, movedPage.id, evt.newIndex);

      ElMessage.success("Page order updated successfully");
    } catch (error) {}
  };

  watch(
    () => pagesStore.pages,
    (newPages) => {
      if (selectedPage.value) {
        const updatedPage = newPages.find(
          (p) => p.id === selectedPage.value?.id,
        );
        if (updatedPage) {
          selectPage(updatedPage);
        }
      }
    },
    { deep: true },
  );

  function initEvents() {
    if (isInitializedLocalEvents.value) return;
    pagesStore.setupStoreEvents();
    isInitializedLocalEvents.value = true;
  }

  function cleanupEvents() {
    pagesStore.cleanupStoreEvents();
  }

  return {
    showAddPageModal,
    showEditPageModal,
    showDeleteModal,
    showAutoGenModal,
    selectedPage,
    pageToDelete,
    autoGenPageCount,
    isInitializedLocalEvents,
    newPage,
    editingPage,
    sortedPages,
    pageGenerating,
    truncateContent,
    checkActivePageGenerationJob,
    selectPage,
    handleAddPage,
    handleEdit,
    handleUpdatePage,
    handleDelete,
    handleConfirmDelete,
    handleDragEnd,
    handleGeneratePagesForStory,
    handleGenerateAllImages,
    handleGenerateAllSpeeches,
    isEndStory,
    initEvents,
    cleanupEvents,
  };
}
