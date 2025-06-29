export interface RequestLog {
  id: number;
  type: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  requestMeta: Record<string, any>;
  responseBody: Record<string, any>;
  error: Record<string, any> | null;
  metadata: Record<string, any>;
  createdAt: string;
}
