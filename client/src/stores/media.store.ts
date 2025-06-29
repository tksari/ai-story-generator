import { defineStore } from "pinia";
import { baseUrl } from "../services/api";

export const useMediaStore = defineStore("media", () => {
  const getMediaUrl = (path: string | null): string | undefined => {
    if (!path) return undefined;
    return `${baseUrl}media/${path}`;
  };

  return {
    getMediaUrl,
  };
});
