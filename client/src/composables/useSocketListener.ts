import { onMounted, onUnmounted } from "vue";
import { socketService } from "@/services/socket.service";
import { EVENT_SUFFIXES } from "@/constants/event";

interface SocketConfig {
  eventPrefix: string;
  onProgress?: (data: any) => void;
  onComplete?: (data: any) => void;
  onFailed?: (data: any) => void;
}

const activeListeners = new Set<string>();

export function useSocketListener(config: SocketConfig) {
  onMounted(() => {
    if (activeListeners.has(config.eventPrefix)) return;
    activeListeners.add(config.eventPrefix);

    if (config.onProgress) {
      socketService.socket?.on(
        `${config.eventPrefix}:${EVENT_SUFFIXES.IN_PROGRESS}`,
        config.onProgress,
      );
    }
    if (config.onComplete) {
      socketService.socket?.on(
        `${config.eventPrefix}:${EVENT_SUFFIXES.DONE}`,
        config.onComplete,
      );
    }
    if (config.onFailed) {
      socketService.socket?.on(
        `${config.eventPrefix}:${EVENT_SUFFIXES.FAILED}`,
        config.onFailed,
      );
    }
  });

  onUnmounted(() => {
    activeListeners.delete(config.eventPrefix);

    if (config.onProgress) {
      socketService.socket?.off(
        `${config.eventPrefix}:${EVENT_SUFFIXES.IN_PROGRESS}`,
        config.onProgress,
      );
    }
    if (config.onComplete) {
      socketService.socket?.off(
        `${config.eventPrefix}:${EVENT_SUFFIXES.DONE}`,
        config.onComplete,
      );
    }
    if (config.onFailed) {
      socketService.socket?.off(
        `${config.eventPrefix}:${EVENT_SUFFIXES.FAILED}`,
        config.onFailed,
      );
    }
  });
}
