import { inject, injectable } from "tsyringe";
import { PrismaClient, GeneratedImage, JobStatus } from "@prisma/client";

export interface CreateGeneratedImageParams {
  pageId: number;
  prompt: string;
  path: string;
  metadata?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateGeneratedImageParams {
  path?: string;
  status?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

@injectable()
export class GeneratedImageRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async create(data: CreateGeneratedImageParams): Promise<GeneratedImage> {
    return this.prisma.generatedImage.create({
      data: {
        pageId: data.pageId,
        prompt: data.prompt,
        path: data.path,
        metadata: data.metadata,
        isDefault: false,
      },
    });
  }

  async createMany(data: CreateGeneratedImageParams[]): Promise<GeneratedImage[]> {
    return this.prisma.generatedImage.createManyAndReturn({
      data,
    });
  }

  async findById(id: number): Promise<GeneratedImage | null> {
    return this.prisma.generatedImage.findUnique({
      where: { id },
    });
  }

  async findByPageId(pageId: number): Promise<GeneratedImage[]> {
    return this.prisma.generatedImage.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: number, data: UpdateGeneratedImageParams): Promise<GeneratedImage> {
    return this.prisma.generatedImage.update({
      where: { id },
      data,
    });
  }

  async getDefaultImage(pageId: number): Promise<GeneratedImage | null> {
    return this.prisma.generatedImage.findFirst({
      where: { pageId, isDefault: true },
    });
  }

  async setDefault(imageId: number, pageId: number): Promise<GeneratedImage> {
    await this.prisma.generatedImage.updateMany({
      where: { pageId, isDefault: true },
      data: { isDefault: false },
    });

    return await this.prisma.generatedImage.update({
      where: { id: imageId },
      data: { isDefault: true },
    });
  }

  async delete(imageId: number): Promise<void> {
    await this.prisma.generatedImage.delete({
      where: { id: imageId },
    });
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
      this.prisma.generatedImage.count(),
      this.prisma.generatedImage.groupBy({
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
