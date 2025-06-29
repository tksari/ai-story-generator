import { useMediaStore } from "@/stores/media.store";
import { useGeneratedImageStore } from "@/stores/generated-image.store";
import { GeneratedImage } from "@/types/generated-image.types";
import { useSocketListener } from "./useSocketListener";
import { useMediaUpdate } from "./useMediaUpdate";
import { ElMessage } from "element-plus";
import { hasAccessAction, hasAccessDelete } from "@/utils/status.helper";
import { EVENT_CHANNELS } from "@/constants/event";
import { emitEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";
import { computed, ComputedRef } from "vue";
import type { Page } from "@/types/page.types";
import { showAlert, showConfirm } from "@/utils/message-box.helper.ts";

export function useImageGallery(page: ComputedRef<Page>) {
  const mediaStore = useMediaStore();
  const generatedImageStore = useGeneratedImageStore();
  const pageId = computed(() => page.value?.id);

  const { handleProgress, handleComplete, handleFailed } =
    useMediaUpdate("generatedImages");

  const getMediaUrl = (path: string | null): string | undefined => {
    if (!path) return undefined;
    return mediaStore.getMediaUrl(path) || undefined;
  };

  const handleView = (image: GeneratedImage) => {
    if (hasAccessAction(image.status)) {
      showAlert(
        `<div style="text-align: center;">
          <img 
            src="${getMediaUrl(image.path)}" 
            style="max-width: 100%; max-height: 80vh; object-fit: contain;"
          />
        </div>`,
        {
          title: "Image Preview",
          dangerouslyUseHTMLString: true,
          customClass: "image-preview-dialog",
          showClose: true,
          closeOnClickModal: true,
          closeOnPressEscape: true,
          center: true,
          confirmButtonText: "Close",
        },
      );
    }
  };

  const handleGenerateImage = async () => {
    try {
      const item = await generatedImageStore.generateImage(pageId.value!);
      emitEvent(EVENT_TYPES.IMAGE_CREATED, { pageId: pageId.value, item });
      ElMessage.success("Image generation job queued successfully");
    } catch (err) {
      ElMessage.error("Failed to queue image generation job");
    }
  };

  const handleSetDefault = async (image: GeneratedImage) => {
    const { status } = image;

    if (hasAccessAction(status)) {
      try {
        const item = await generatedImageStore.setDefaultImage(image.id);
        emitEvent(EVENT_TYPES.IMAGE_SET_DEFAULT, {
          pageId: pageId.value,
          item,
        });

        ElMessage.success("Image set as default successfully");
      } catch (err) {
        ElMessage.error("Failed to set image as default");
      }
    }
  };

  const handleDelete = async (image: GeneratedImage) => {
    const { id, status } = image;

    if (hasAccessDelete(status)) {
      try {
        await showConfirm("Are you sure you want to delete this image?", {
          title: "Delete Image",
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
        });
        await generatedImageStore.deleteImage(id);
        emitEvent(EVENT_TYPES.IMAGE_DELETED, { pageId: pageId.value, id });

        ElMessage.success("Image deleted successfully");
      } catch (err) {}
    }
  };

  useSocketListener({
    eventPrefix: EVENT_CHANNELS.IMAGE,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onFailed: handleFailed,
  });

  return {
    getMediaUrl,
    handleView,
    handleGenerateImage,
    handleSetDefault,
    handleDelete,
  };
}
