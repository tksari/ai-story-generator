import { z } from "zod";
import {
  languageOptions,
  levelOptions,
  storyTypeOptions,
  ageGroupOptions,
  genreOptions,
} from "@/domain/shared/generation/generation-options";

const enumFromOptions = <T extends { code: string }[]>(options: T) =>
  z.enum(options.map((o) => o.code) as [string, ...string[]]);

export const storyGenerationSchema = z.object({
  language: enumFromOptions(languageOptions),
  language_level: enumFromOptions(levelOptions),
  max_sentences: z.number().min(1).max(100),
  story_type: enumFromOptions(storyTypeOptions),
  age_group: enumFromOptions(ageGroupOptions),
  genre: enumFromOptions(genreOptions),
  theme: z.string().max(255),
  characters: z.string().max(1000),
});

export type StoryGenerationConfig = z.infer<typeof storyGenerationSchema>;
