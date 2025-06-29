import { api } from "./api";
import type { RequestLog, RequestLogResponse } from "@/types/request-log.types";

export class RequestLogService {
  async getRequestLogs(page = 1, pageSize = 10): Promise<RequestLogResponse> {
    const response = await api.get("/request-logs", {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getRequestLogById(id: number): Promise<RequestLog> {
    const response = await api.get(`/request-logs/${id}`);
    return response.data;
  }
}

export const requestLogService = new RequestLogService();
