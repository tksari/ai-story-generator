import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useGenerateVideoStore } from "@/stores/generate-video.store";
import { useSocketListener } from "@/composables/useSocketListener";
import { EVENT_CHANNELS } from "@/constants/event";
import { TaskStatus } from "@/types/common.types";
import type { GeneratedVideo } from "@/types/generated-video.types";
import { emitEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";

export function useVideoGallery() {
  const generateVideoStore = useGenerateVideoStore();
  const showPreview = ref(false);
  const showDeleteDialog = ref(false);
  const selectedVideo = ref<GeneratedVideo | null>(null);
  const videoToDelete = ref<GeneratedVideo | null>(null);
  const isDeleting = ref(false);
  const isGeneratingVideo = ref(false);

  const handleProgress = (data: {
    storyId: number;
    id: number;
    progress: number;
    message: string;
  }) => {
    emitEvent(EVENT_TYPES.VIDEO_UPDATE, {
      item: {
        id: data.id,
        status: TaskStatus.IN_PROGRESS,
        progress: data.progress,
        message: data.message,
      },
    });
  };

  const handleComplete = (data: {
    storyId: number;
    id: number;
    path: string;
    duration: number;
  }) => {
    emitEvent(EVENT_TYPES.VIDEO_UPDATE, {
      item: {
        id: data.id,
        status: TaskStatus.DONE,
        path: data.path,
        duration: data.duration,
      },
    });
  };

  const handleFailed = (data: {
    storyId: number;
    id: number;
    error: string;
  }) => {
    emitEvent(EVENT_TYPES.VIDEO_UPDATE, {
      item: { id: data.id, status: TaskStatus.FAILED, error: data.error },
    });
  };

  useSocketListener({
    eventPrefix: EVENT_CHANNELS.VIDEO,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onFailed: handleFailed,
  });

  const handleWatch = (video: GeneratedVideo) => {
    selectedVideo.value = video;
    generateVideoStore.setCurrentVideo(video);
    showPreview.value = true;
  };

  const handleDelete = (video: GeneratedVideo) => {
    videoToDelete.value = video;
    showDeleteDialog.value = true;
  };

  const confirmDelete = async () => {
    if (!videoToDelete.value) return;

    try {
      isDeleting.value = true;
      const { storyId, id } = videoToDelete.value;

      await generateVideoStore.deleteVideo(id);
      emitEvent(EVENT_TYPES.VIDEO_DELETED, { storyId, id });

      ElMessage.success("Video deleted successfully");
      showDeleteDialog.value = false;
      videoToDelete.value = null;
    } catch (error) {
    } finally {
      isDeleting.value = false;
      showDeleteDialog.value = false;
    }
  };

  const handleGenerateVideo = async (storyId: number) => {
    try {
      isGeneratingVideo.value = true;
      const video = await generateVideoStore.generateVideo(storyId);

      emitEvent(EVENT_TYPES.VIDEO_CREATED, { storyId, video });
      ElMessage.success("Video generation started!");
      return video;
    } catch (error: any) {
    } finally {
      isGeneratingVideo.value = false;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    showPreview,
    showDeleteDialog,
    selectedVideo,
    isDeleting,
    isGeneratingVideo,
    handleWatch,
    handleDelete,
    confirmDelete,
    handleGenerateVideo,
    formatDate,
    formatDuration,
  };
}
