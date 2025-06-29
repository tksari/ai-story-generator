import type { Story } from "@prisma/client";
import { StoryGenerationConfig } from "../story-generation.schema";
import { Settings } from "@/domain/story/settings.schema";

export type StoryUpdatableFields = Partial<Omit<Story, "id" | "createdAt" | "updatedAt">>;

export type CreateStoryParams = StoryUpdatableFields & {
  generationConfig?: StoryGenerationConfig;
  settings?: Settings;
};

export type UpdateStoryParams = StoryUpdatableFields & {
  generationConfig?: StoryGenerationConfig;
  settings?: Settings;
};

export interface CreatePageParams {
  storyId: number;
  pageNumber: number;
  content: string;
  imagePath?: string | null;
}
