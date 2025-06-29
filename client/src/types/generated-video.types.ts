import { TaskStatus } from "./common.types";

export interface GeneratedVideo {
  id: number;
  storyId: number;
  title: string;
  path: string;
  status: TaskStatus;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  progress?: {
    value: number;
    message: string;
  };
}
