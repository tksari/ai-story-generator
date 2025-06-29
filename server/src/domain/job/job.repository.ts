import { inject, injectable } from "tsyringe";
import { PrismaClient, Job, JobStatus, JobType } from "@prisma/client";
import { CreateJobParams, UpdateJobParams } from "@/domain/job/job.types";
import { generateTaskId } from "./job.utils";

@injectable()
export class JobRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async findById(id: number): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id },
    });
  }

  async findAnyActiveJobByStoryIdAndTypes(storyId: number, types: JobType[]): Promise<Job | null> {
    return this.prisma.job.findFirst({
      where: {
        storyId,
        type: { in: types },
        status: {
          in: [JobStatus.PENDING, JobStatus.IN_PROGRESS],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByTaskId(taskId: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { taskId },
    });
  }

  async create(data: CreateJobParams): Promise<Job> {
    return this.prisma.job.create({
      data: {
        taskId: data.taskId ?? generateTaskId(),
        type: data.type,
        status: data.status ?? JobStatus.PENDING,
        storyId: data.storyId ?? undefined,
        pageId: data.pageId,
        metadata: data.metadata ?? undefined,
        error: data.error ?? undefined,
        result: data.result ?? undefined,
        dependsOn: data.dependsOn ?? [],
      },
    });
  }

  async createJobMany(data: CreateJobParams[]): Promise<Job[]> {
    return this.prisma.job.createManyAndReturn({
      data: data.map((item) => ({
        taskId: item.taskId ?? generateTaskId(),
        status: item.status ?? JobStatus.PENDING,
        storyId: item.storyId ?? undefined,
        pageId: item.pageId ?? undefined,
        metadata: item.metadata ?? undefined,
        dependsOn: item.dependsOn ?? [],
        type: item.type,
      })),
    });
  }

  async getJobByTaskId(taskId: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { taskId },
    });
  }

  async update(taskId: string, data: UpdateJobParams): Promise<Job> {
    return this.prisma.job.update({
      where: { taskId },
      data: {
        ...data,
        metadata: data.metadata ?? undefined,
        error: data.error ?? undefined,
        result: data.result ?? undefined,
        dependsOn: data.dependsOn ?? [],
      },
    });
  }

  async delete(taskId: string): Promise<Job> {
    return this.prisma.job.delete({
      where: { taskId },
    });
  }

  async getJobs(page = 1, pageSize = 10): Promise<{ jobs: Job[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.job.count(),
    ]);

    return { jobs, total };
  }

  async getJobsByStoryId(storyId: number): Promise<Job[]> {
    return this.prisma.job.findMany({
      where: { storyId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async deleteJobsByStoryId(storyId: number): Promise<number> {
    const result = await this.prisma.job.deleteMany({
      where: { storyId },
    });

    return result.count;
  }

  async getJobStats(): Promise<{
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalCount: number;
    recentJobs: Job[];
  }> {
    const statusGroups = await this.prisma.job.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const typeGroups = await this.prisma.job.groupBy({
      by: ["type"],
      _count: {
        _all: true,
      },
    });

    const recentJobs = await this.prisma.job.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const totalCount = await this.prisma.job.count();

    const byStatus = statusGroups.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {});

    const byType = typeGroups.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.type] = curr._count._all;
      return acc;
    }, {});

    return {
      byStatus,
      byType,
      totalCount,
      recentJobs,
    };
  }

  async getJobsByDependency(taskId: string): Promise<Job[]> {
    return this.prisma.job.findMany({
      where: {
        dependsOn: {
          has: taskId,
        },
      },
    });
  }

  async getJobStatuses(taskIds: string[]): Promise<JobStatus[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
      select: {
        status: true,
      },
    });

    return jobs.map((j) => j.status);
  }

  async getJobWaitingOnDependency(jobId: string, type: JobType): Promise<Job | null> {
    return this.prisma.job.findFirst({
      where: {
        type,
        status: JobStatus.PENDING,
        dependsOn: {
          has: jobId,
        },
      },
    });
  }
}
