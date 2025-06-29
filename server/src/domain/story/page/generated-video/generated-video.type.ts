export interface GeneratedVideoBaseParams {
  status?: string;
  duration?: number;
  metadata?: Record<string, any>;
}
export interface CreateGeneratedVideoParams extends GeneratedVideoBaseParams {
  title: string;
  storyId: number;
  prompt: string;
  path: string;
}

export interface UpdateGeneratedVideoParams extends GeneratedVideoBaseParams {
  title?: string;
  path?: string;
}
