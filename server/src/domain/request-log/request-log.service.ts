import { inject, injectable } from "tsyringe";
import { RequestLog } from "@prisma/client";
import { RequestLogRepository } from "@/domain/request-log/request-log.repository";
import { CreateRequestLogParams } from "@/domain/request-log/request-log.types";
import { LogService } from "@/infrastructure/logging/log.service";
import axios from "axios";

@injectable()
export class RequestLogService {
  constructor(
    @inject("RequestLogRepository")
    private requestLogRepository: RequestLogRepository,
    @inject("LogService") private logService: LogService
  ) {}

  async log(params: CreateRequestLogParams): Promise<void> {
    try {
      const log = await this.requestLogRepository.create(params);
      this.logService.debug(`Logged request: ${log.id} - ${log.endpoint}`);
    } catch (error) {
      this.logService.error(
        `Error logging request: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getById(id: number): Promise<RequestLog | null> {
    return this.requestLogRepository.getById(id);
  }

  async getLogs(page = 1, pageSize = 10): Promise<{ logs: RequestLog[]; total: number }> {
    return this.requestLogRepository.getLogs(page, pageSize);
  }

  async getRecentErrors(limit = 10): Promise<RequestLog[]> {
    return this.requestLogRepository.getRecentErrors(limit);
  }

  createLogger() {
    return async <T>(
      type: string,
      endpoint: string,
      method: string,
      requestMeta: Record<string, any>,
      apiCall: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> => {
      const start = Date.now();
      let statusCode = 200;
      let result: T;
      let error: any = null;

      try {
        result = await apiCall();
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          statusCode = err.response?.status || 500;
          error = { message: err.message, stack: err.stack };
        } else if (err instanceof Error) {
          statusCode = 500;
          error = { message: err.message, stack: err.stack };
        } else {
          statusCode = 500;
          error = { message: String(err) };
        }

        throw err;
      } finally {
        const duration = Date.now() - start;

        await this.log({
          type,
          endpoint,
          method,
          requestMeta,
          error,
          metadata,
          duration,
          statusCode,
        });
      }
    };
  }
}
