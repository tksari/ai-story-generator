import { GeneratedVideo } from "./generated-video.types";
import type { Page } from "./page.types";
import { CapabilityType } from "./provider.types";

export interface BackgroundSettings {
  type: "color" | "image" | "gradient";
  color?: string;
  image?: string;
  fit?: "cover" | "contain" | "fill";
  gradientType?: "linear" | "radial";
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  opacity?: number;
}

export interface ProviderSettings {
  overrides: Record<CapabilityType, number> | null;
}

export interface LayoutSettings {
  id: string;
}

export interface StorySettings {
  video: {
    resolution: string;
    fps: number;
    codec: string;
    quality: string;
    bitrate: string;
    pixel_format: string;
  };
  audio: {
    codec: string;
    bitrate: string;
    sample_rate: string;
    channels: string;
    normalization: boolean;
  };
  transition: {
    type: string;
  };
  layout: LayoutSettings | null;
  providers: ProviderSettings;
  background: BackgroundSettings;
}

export interface GenerationConfig {
  language: string;
  language_level: string;
  max_sentences: number;
  story_type: string;
  age_group: string;
  genre: string;
  theme: string;
  characters: string;
}

export interface BaseStory {
  title: string;
  description: string;
  generationConfig: GenerationConfig;
  settings: StorySettings;
  pages?: Page[];
}

export interface CreateStoryDto extends BaseStory {}

export interface Story extends BaseStory {
  id: number;
  pages: Page[];
  generatedVideos: GeneratedVideo[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoryDto extends BaseStory {}

export interface GenerateVideoDto {
  storyId: string;
  title?: string;
}
