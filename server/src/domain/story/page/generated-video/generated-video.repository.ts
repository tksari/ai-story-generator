import { inject, injectable } from "tsyringe";
import { PrismaClient, GeneratedVideo, JobStatus } from "@prisma/client";
import { CreateGeneratedVideoParams, UpdateGeneratedVideoParams } from "./generated-video.type";

@injectable()
export class GeneratedVideoRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async create(data: CreateGeneratedVideoParams): Promise<GeneratedVideo> {
    return this.prisma.generatedVideo.create({
      data: {
        ...data,
        prompt: data.prompt || data.title,
        status: JobStatus.PENDING,
      },
    });
  }

  async findById(id: number): Promise<GeneratedVideo | null> {
    return this.prisma.generatedVideo.findUnique({
      where: { id },
    });
  }

  async findByStoryId(storyId: number): Promise<GeneratedVideo[]> {
    return this.prisma.generatedVideo.findMany({
      where: { storyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: number, data: UpdateGeneratedVideoParams): Promise<GeneratedVideo> {
    return this.prisma.generatedVideo.update({
      where: { id },
      data,
    });
  }

  async setDefault(id: number, storyId: number): Promise<GeneratedVideo> {
    return this.prisma.$transaction(async (tx) => {
      await tx.generatedVideo.updateMany({
        where: { storyId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.generatedVideo.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  async getDefaultVideo(storyId: number): Promise<GeneratedVideo | null> {
    return this.prisma.generatedVideo.findFirst({
      where: { storyId, isDefault: true },
    });
  }

  async delete(id: number): Promise<GeneratedVideo> {
    return this.prisma.generatedVideo.delete({
      where: { id },
    });
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    lastVideos: {
      id: number;
      storyId: number;
      title: string | null;
      path: string | null;
      duration: number | null;
      createdAt: Date;
    }[];
  }> {
    const ALL_STATUSES = [
      JobStatus.PENDING,
      JobStatus.IN_PROGRESS,
      JobStatus.DONE,
      JobStatus.FAILED,
      JobStatus.SKIPPED,
    ];

    const [total, byStatus, lastVideos] = await Promise.all([
      this.prisma.generatedVideo.count(),
      this.prisma.generatedVideo.groupBy({
        by: ["status"],
        _count: true,
      }),
      this.prisma.generatedVideo.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          status: JobStatus.DONE,
        },
        take: 5,
        select: {
          id: true,
          storyId: true,
          title: true,
          path: true,
          duration: true,
          createdAt: true,
        },
      }),
    ]);

    const statusCounts = ALL_STATUSES.reduce<Record<string, number>>((acc, status) => {
      acc[status] = byStatus.find((item) => item.status === status)?._count || 0;
      return acc;
    }, {});

    return {
      total,
      byStatus: statusCounts,
      lastVideos: lastVideos,
    };
  }
}
