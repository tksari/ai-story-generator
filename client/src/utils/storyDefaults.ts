import {
  BackgroundSettings,
  GenerationConfig,
  StorySettings,
} from "@/types/story.types";

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: "color",
  color: "#ffffff",
  image: "",
  fit: "cover",
  gradientType: "linear",
  gradientStart: "#ffffff",
  gradientEnd: "#000000",
  gradientAngle: 0,
  opacity: 100,
};

export const DEFAULT_VIDEO_SETTINGS: StorySettings = {
  video: {
    resolution: "1920x1080",
    fps: 30,
    codec: "libx264",
    quality: "medium",
    bitrate: "1000k",
    pixel_format: "yuv420p",
  },
  audio: {
    codec: "aac",
    bitrate: "128k",
    sample_rate: "44100",
    channels: "2",
    normalization: false,
  },
  transition: {
    type: "fade",
  },
  background: DEFAULT_BACKGROUND_SETTINGS,
  providers: {
    overrides: null,
  },
  layout: null,
};

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  language: "en",
  language_level: "A2",
  max_sentences: 20,
  story_type: "normal",
  age_group: "16-18",
  genre: "adventure",
  theme: "",
  characters: "",
};

export const DEFAULT_STORY_SETTINGS = {
  title: "",
  description: "",
  generationConfig: DEFAULT_GENERATION_CONFIG,
  settings: DEFAULT_VIDEO_SETTINGS,
};
