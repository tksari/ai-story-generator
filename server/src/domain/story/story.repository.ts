import { inject, injectable } from "tsyringe";
import { PrismaClient, Story, Prisma } from "@prisma/client";
import { CreateStoryParams, UpdateStoryParams } from "./types/story.type";

@injectable()
export class StoryRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async createStory(data: CreateStoryParams): Promise<Story> {
    return this.prisma.story.create({
      data: {
        title: data.title || "",
        description: data.description || "",
        generationConfig: data.generationConfig || {},
        settings: data.settings || {},
      },
    });
  }

  async getStoryById(id: number): Promise<Story | null> {
    return this.prisma.story.findUnique({
      where: { id },
    });
  }

  async getStoryWithPages(id: number): Promise<(Story & { pages: any[] }) | null> {
    return this.prisma.story.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: {
            pageNumber: "asc",
          },
          include: {
            generatedImages: {
              select: {
                id: true,
                path: true,
              },
              orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            },
            generatedSpeeches: {
              orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            },
          },
        },
        generatedVideos: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });
  }

  async updateStory(id: number, data: UpdateStoryParams): Promise<Story> {
    const updateData: Prisma.StoryUpdateInput = {
      ...data,
      settings: data.settings || {},
      generationConfig: data.generationConfig || {},
    };

    return this.prisma.story.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteStory(id: number): Promise<Story> {
    return this.prisma.story.delete({
      where: { id },
    });
  }

  async getStories(page = 1, pageSize = 10): Promise<{ stories: Story[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        skip,
        take: pageSize,
        orderBy: {
          id: "desc",
        },
        include: {
          _count: {
            select: {
              pages: true,
              generatedVideos: true,
            },
          },
        },
      }),
      this.prisma.story.count(),
    ]);

    return { stories, total };
  }

  async searchStories(
    query: string,
    page = 1,
    pageSize = 10
  ): Promise<{ stories: Story[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.story.count({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return { stories, total };
  }

  async getStats(): Promise<{
    total: number;
    lastStories: {
      id: number;
      title: string;
      createdAt: Date;
    }[];
  }> {
    const [total, lastStories] = await Promise.all([
      this.prisma.story.count(),
      this.prisma.story.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      lastStories,
    };
  }
}
