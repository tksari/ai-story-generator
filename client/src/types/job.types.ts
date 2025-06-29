export interface Job {
  id: number;
  taskId: string;
  type: string;
  status: string;
  progress: number;
  storyId: number;
  pageId: number | null;
  metadata: Record<string, any>;
  error: string | null;
  result: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  duration: number;
  dependsOn: string[];
}
