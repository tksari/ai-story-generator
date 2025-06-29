import { TaskStatus } from "./common.types";

export interface GenerateImageDto {
  prompt: string;
  storyPageId: number;
}

export interface GeneratedImage {
  id: number;
  storyId: number;
  pageId: number;
  path: string;
  status: TaskStatus;
  isDefault: boolean;
  progress: {
    value: number;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}
