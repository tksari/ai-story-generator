import { inject, injectable } from "tsyringe";
import { PrismaClient, Page } from "@prisma/client";
import { CreatePageInput, UpdatePageInput } from "./page.schema";

@injectable()
export class PageRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async findById(id: number): Promise<Page | null> {
    return this.prisma.page.findUnique({
      where: { id },
    });
  }

  async findByStoryId(storyId: number): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: { storyId },
      orderBy: { pageNumber: "asc" },
    });
  }

  async create(storyId: number, data: CreatePageInput): Promise<Page> {
    return this.prisma.page.create({
      data: {
        storyId: storyId,
        pageNumber: data.pageNumber,
        content: data.content,
      },
    });
  }

  async update(id: number, data: UpdatePageInput): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Page> {
    return this.prisma.page.delete({
      where: { id },
    });
  }

  async getStoryPagesWithMedia(storyId: number): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: { storyId },
      orderBy: {
        pageNumber: "asc",
      },
      include: {
        generatedImages: {
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        },
        generatedSpeeches: {
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        },
      },
    });
  }

  async deletePagesByStoryId(storyId: number): Promise<number> {
    const result = await this.prisma.page.deleteMany({
      where: { storyId },
    });

    return result.count;
  }

  async findLastPagesWithContent(
    storyId: number,
    count = 3
  ): Promise<{ pageNumber: number; content: string }[]> {
    const pages = await this.prisma.page.findMany({
      where: { storyId },
      orderBy: { pageNumber: "desc" },
      take: count,
      select: {
        pageNumber: true,
        content: true,
      },
    });

    return pages.reverse();
  }

  async getPagesWithContentByStoryId(storyId: number) {
    return this.prisma.page.findMany({
      where: {
        storyId,
        AND: [{ content: { not: "" } }, { content: { not: undefined } }],
      },
      orderBy: {
        pageNumber: "asc",
      },
    });
  }

  async hasAllPagesContent(storyId: number): Promise<boolean> {
    const pagesWithoutContent = await this.prisma.page.count({
      where: {
        storyId,
        OR: [{ content: "" }, { content: undefined }],
      },
    });

    return pagesWithoutContent === 0;
  }

  async updateMany(updates: Array<{ id: number; data: Partial<Page> }>): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, data }) =>
        this.prisma.page.update({
          where: { id },
          data,
        })
      )
    );
  }
}
