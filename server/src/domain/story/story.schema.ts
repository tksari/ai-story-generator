import z from "zod";
import { storyGenerationSchema } from "./story-generation.schema";
import { settingsSchema } from "@/domain/story/settings.schema";

const baseStorySchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().max(1000).optional(),
  generationConfig: storyGenerationSchema,
  settings: settingsSchema,
});

export const createStorySchema = baseStorySchema;
export const updateStorySchema = baseStorySchema.partial();

export type CreateStory = z.infer<typeof createStorySchema>;
export type UpdateStory = z.infer<typeof updateStorySchema>;
