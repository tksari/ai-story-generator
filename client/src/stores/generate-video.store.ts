import { defineStore } from "pinia";
import { generatedVideoService } from "@/services/generated-video.service";
import type { GeneratedVideo } from "@/types/generated-video.types";

export const useGenerateVideoStore = defineStore("generate-video", {
  state: () => ({
    videos: [] as GeneratedVideo[],
    currentVideo: null as GeneratedVideo | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getVideos: (state) => state.videos,
    getCurrentVideo: (state) => state.currentVideo,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchStoryVideos(storyId: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedVideoService.getStoryVideos(storyId);
        this.videos = response.videos;
        return response.videos;
      } catch (error) {
        this.error = "Failed to fetch videos";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteVideo(videoId: number) {
      this.loading = true;
      this.error = null;
      try {
        await generatedVideoService.deleteVideo(videoId);
      } catch (error) {
        this.error = "Failed to delete video";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async generateVideo(storyId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedVideoService.generateVideo(storyId);
        this.videos.push(response.video);
        return response.video;
      } catch (error) {
        this.error = "Failed to generate video";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async checkVideoStatus(videoId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await generatedVideoService.getVideoStatus(videoId);
        return response.video;
      } catch (error) {
        this.error = "Failed to check video status";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setCurrentVideo(video: GeneratedVideo | null) {
      this.currentVideo = video;
    },

    clearError() {
      this.error = null;
    },
  },
});
