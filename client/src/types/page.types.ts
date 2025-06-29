import type { GeneratedImage } from "./generated-image.types";
import type { GeneratedSpeech } from "./generated-speech.types";

export interface Page {
  id: number;
  storyId: number;
  pageNumber: number;
  content: string;
  contentHash: string | null;
  generatedImages: GeneratedImage[];
  generatedSpeeches?: GeneratedSpeech[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageDto {
  pageNumber: number;
  content: string;
}

export interface UpdatePageDto {
  id: number;
  pageNumber: number;
  content: string;
}

export interface GeneratePagesForStoryDto {
  type: string;
  pageCount?: number;
  isEndStory?: boolean;
}
