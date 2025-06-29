export interface CreateRequestLogParams {
  type: string;
  endpoint: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  requestMeta?: Record<string, any>;
  responseBody?: Record<string, any>;
  error?: Record<string, any>;
  metadata?: Record<string, any>;
}
