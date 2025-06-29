import { TaskStatus } from "./common.types";

export interface GeneratedSpeech {
  id: number;
  pageId: number;
  path: string;
  isDefault: boolean;
  status: TaskStatus;
  progress?: {
    value: number;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedSpeechStats {
  totalSpeeches: number;
  defaultSpeechId: number | null;
}

export interface GenerateSpeechRequest {
  pageId: number;
  speechId?: number;
}
