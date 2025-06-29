import { emitEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";
import { TaskStatus } from "@/types/common.types";

type MediaKey = "generatedImages" | "generatedSpeeches" | "generatedVideos";

export function useMediaUpdate(mediaKey: MediaKey) {
  const handleStarted = (data: { pageId: number; id: number }) => {
    emitEvent(EVENT_TYPES.MEDIA_UPDATE, {
      pageId: data.pageId,
      item: {
        id: data.id,
        status: TaskStatus.IN_PROGRESS,
      },
    });
  };

  const handleProgress = (data: any) => {
    emitEvent(EVENT_TYPES.MEDIA_UPDATE, {
      key: mediaKey,
      pageId: data.pageId,
      item: {
        id: data.id,
        status: TaskStatus.IN_PROGRESS,
      },
    });
  };

  const handleComplete = (data: any) => {
    emitEvent(EVENT_TYPES.MEDIA_UPDATE, {
      key: mediaKey,
      pageId: data.pageId,
      item: {
        id: data.id,
        path: data.path,
        status: TaskStatus.DONE,
        isDefault: data.isDefault,
      },
    });
  };

  const handleFailed = (data: any) => {
    emitEvent(EVENT_TYPES.MEDIA_UPDATE, {
      key: mediaKey,
      pageId: data.pageId,
      item: {
        id: data.id,
        status: TaskStatus.FAILED,
      },
    });
  };

  return {
    handleStarted,
    handleProgress,
    handleComplete,
    handleFailed,
  };
}
