import { GeneratedImage, GeneratedSpeech, Page, Story } from "@prisma/client";
import { LayoutItem } from "@/domain/video/types/video-layout.types";

export interface VideoCodecSettings {
  fps?: number;
  codec?: string;
  format?: string;
  bitrate?: string;
  quality?: string;
  resolution?: string;
  pixel_format?: string;
}

export interface AudioCodecSettings {
  codec?: string;
  bitrate?: string;
  channels?: number;
  normalization?: boolean;
  sample_rate?: number;
}

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface ImageLayoutItem {
  type: "image";
  width: number;
  height: number;
  position: LayoutPosition;
}

export interface StorySettings {
  audio?: AudioCodecSettings;
  video?: VideoCodecSettings;
  background?: any;
  layout?: {
    id: string;
    items: LayoutItem[];
  };
}

export interface StoryPageData {
  pageNumber: number;
  content: string;
  generatedImages?: GeneratedImage[];
  generatedSpeeches?: GeneratedSpeech[];
}

export type StoryWithPages = Story & { pages: Page[] };

export interface VideoGenerationParams {
  story: StoryWithPages;
  layout: LayoutItem[];
  progressCallback?: (progress: number) => void;
}

export interface ComplexFilterResult {
  filterString: string;
  finalVideoLabel: string;
  finalAudioLabel: string;
}

export interface PageFilterSegmentResult {
  segmentString: string;
  outputLabel: string;
}
