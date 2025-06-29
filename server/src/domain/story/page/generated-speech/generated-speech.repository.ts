import { inject, injectable } from "tsyringe";

import { PrismaClient, GeneratedSpeech, JobStatus } from "@prisma/client";

export interface CreateGeneratedSpeechParams {
  pageId: number;
  text: string;
  path: string;
  metadata?: Record<string, any>;
  isDefault?: boolean;
  status?: string;
}

export interface UpdateGeneratedSpeechParams {
  path?: string;
  status?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

@injectable()
export class GeneratedSpeechRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async create(data: CreateGeneratedSpeechParams): Promise<GeneratedSpeech> {
    return this.prisma.generatedSpeech.create({
      data: {
        pageId: data.pageId,
        text: data.text,
        path: data.path,
        metadata: data.metadata,
        isDefault: false,
        status: JobStatus.PENDING,
      },
    });
  }

  async findById(id: number): Promise<GeneratedSpeech | null> {
    return this.prisma.generatedSpeech.findUnique({
      where: { id },
    });
  }

  async findByPageId(pageId: number): Promise<GeneratedSpeech[]> {
    return this.prisma.generatedSpeech.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: number, data: UpdateGeneratedSpeechParams): Promise<GeneratedSpeech> {
    return this.prisma.generatedSpeech.update({
      where: { id },
      data,
    });
  }

  async getDefaultSpeech(pageId: number): Promise<GeneratedSpeech | null> {
    return this.prisma.generatedSpeech.findFirst({
      where: { pageId, isDefault: true },
    });
  }

  async setDefault(speechId: number, pageId: number): Promise<GeneratedSpeech> {
    await this.prisma.generatedSpeech.updateMany({
      where: { pageId, isDefault: true },
      data: { isDefault: false },
    });

    return await this.prisma.generatedSpeech.update({
      where: { id: speechId },
      data: { isDefault: true },
    });
  }

  async delete(speechId: number): Promise<void> {
    await this.prisma.generatedSpeech.delete({
      where: { id: speechId },
    });
  }

  async getSpeechStats(pageId: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const [total, byStatus] = await Promise.all([
      this.prisma.generatedSpeech.count({
        where: { pageId },
      }),
      this.prisma.generatedSpeech.groupBy({
        by: ["status"],
        where: { pageId },
        _count: true,
      }),
    ]);

    const statusCounts = byStatus.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    return {
      total,
      byStatus: statusCounts,
    };
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const ALL_STATUSES = [
      JobStatus.PENDING,
      JobStatus.IN_PROGRESS,
      JobStatus.DONE,
      JobStatus.FAILED,
      JobStatus.SKIPPED,
    ];

    const [total, byStatus] = await Promise.all([
      this.prisma.generatedSpeech.count(),
      this.prisma.generatedSpeech.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const statusCounts = ALL_STATUSES.reduce<Record<string, number>>((acc, status) => {
      acc[status] = byStatus.find((item) => item.status === status)?._count || 0;
      return acc;
    }, {});

    return {
      total,
      byStatus: statusCounts,
    };
  }
}
