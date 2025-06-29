import { inject, injectable } from "tsyringe";
import type { PrismaClient, RequestLog } from "@prisma/client";
import { CreateRequestLogParams } from "@/domain/request-log/request-log.types";

@injectable()
export class RequestLogRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async create(data: CreateRequestLogParams): Promise<RequestLog> {
    return this.prisma.requestLog.create({
      data: {
        type: data.type,
        endpoint: data.endpoint,
        method: data.method || "UNKNOWN",
        statusCode: data.statusCode || 0,
        duration: data.duration || 0,
        requestMeta: data.requestMeta || {},
        responseBody: data.responseBody || {},
        error: data.error || {},
        metadata: data.metadata || {},
      },
    });
  }

  async getById(id: number): Promise<RequestLog | null> {
    return this.prisma.requestLog.findUnique({
      where: { id },
    });
  }

  async getLogs(page = 1, pageSize = 10): Promise<{ logs: RequestLog[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.requestLog.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.requestLog.count(),
    ]);

    return { logs, total };
  }

  async getRecentErrors(limit = 10): Promise<RequestLog[]> {
    return this.prisma.requestLog.findMany({
      where: {
        statusCode: {
          gte: 400,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }
}
