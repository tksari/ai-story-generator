import { useMediaStore } from "@/stores/media.store";
import { useGeneratedSpeechStore } from "@/stores/generated-speech.store";
import { GeneratedSpeech } from "@/types/generated-speech.types";
import { ElMessage } from "element-plus";
import { useSocketListener } from "./useSocketListener";
import { useMediaUpdate } from "./useMediaUpdate";
import { EVENT_CHANNELS } from "@/constants/event";
import { emitEvent } from "@/events/emitter";
import { EVENT_TYPES } from "@/events/event-types";
import { computed, ComputedRef } from "vue";
import type { Page } from "@/types/page.types";
import { showConfirm } from "@/utils/message-box.helper.ts";

export function useSpeechGallery(page: ComputedRef<Partial<Page>>) {
  const mediaStore = useMediaStore();
  const generatedSpeechStore = useGeneratedSpeechStore();
  const pageId = computed(() => page.value?.id);

  const { handleProgress, handleComplete, handleFailed } =
    useMediaUpdate("generatedSpeeches");

  const getMediaUrl = (path: string | null): string | undefined => {
    if (!path) return undefined;
    return mediaStore.getMediaUrl(path) || undefined;
  };

  const handleSetDefaultSpeech = async (speech: GeneratedSpeech) => {
    try {
      const item = await generatedSpeechStore.setDefaultSpeech(speech.id);
      emitEvent(EVENT_TYPES.SPEECH_SET_DEFAULT, { pageId: pageId.value, item });
      ElMessage.success("speech set as default successfully");
    } catch (err) {
      ElMessage.error("Failed to set speech as default");
    }
  };

  const handleDeleteSpeech = async (speech: GeneratedSpeech) => {
    try {
      await showConfirm("Are you sure you want to delete this speech?", {
        title: "Delete speech",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      });
      const { id } = speech;
      await generatedSpeechStore.deleteSpeech(id);
      emitEvent(EVENT_TYPES.SPEECH_DELETED, { pageId: pageId.value, id });
      ElMessage.success("speech deleted successfully");
    } catch (err) {
      if (err !== "cancel") {
        ElMessage.error("Failed to delete speech");
      }
    }
  };

  const handleGenerateSpeech = async () => {
    try {
      const item = await generatedSpeechStore.generateSpeech(pageId.value!);
      emitEvent(EVENT_TYPES.SPEECH_CREATED, { pageId: pageId.value, item });
      ElMessage.success("speech generation job queued successfully");
    } catch (err) {
      ElMessage.error("Failed to queue speech generation job");
    }
  };

  useSocketListener({
    eventPrefix: EVENT_CHANNELS.SPEECH,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onFailed: handleFailed,
  });

  return {
    getMediaUrl,
    handleSetDefaultSpeech,
    handleDeleteSpeech,
    handleGenerateSpeech,
  };
}
