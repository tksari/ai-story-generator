import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";

@injectable()
export class VideoLayoutRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async saveLayout(data: any) {
    return this.prisma.videoLayout.create({
      data: {
        name: data.name || "New Layout",
        items: data.items || [],
      },
    });
  }

  async getLayout(id: string) {
    return this.prisma.videoLayout.findUnique({
      where: { id },
    });
  }

  async updateLayout(id: string, data: any) {
    return this.prisma.videoLayout.update({
      where: { id },
      data: {
        name: data.name,
        items: data.items,
      },
    });
  }

  async deleteLayout(id: string) {
    return this.prisma.videoLayout.delete({
      where: { id },
    });
  }

  async listLayouts() {
    return this.prisma.videoLayout.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
