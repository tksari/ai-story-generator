import { PrismaClient, Voice } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { createVoiceInput, updateVoiceInput } from "@/types/voice.types";

@injectable()
export class VoiceRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async findMany(includeInactive: boolean = false): Promise<Voice[]> {
    return this.prisma.voice.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        provider: true,
      },
    });
  }

  async findManyByProviderId(
    providerId: number,
    includeInactive: boolean = false
  ): Promise<Voice[]> {
    return this.prisma.voice.findMany({
      where: {
        providerId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
  }

  async findById(id: number): Promise<Voice | null> {
    return this.prisma.voice.findUnique({
      where: { id },
    });
  }

  async findDefaultByProviderId(providerId: number): Promise<Voice | null> {
    return this.prisma.voice.findFirst({
      where: {
        providerId,
        isDefault: true,
      },
      include: {
        provider: true,
      },
    });
  }

  async create(providerId: number, data: createVoiceInput): Promise<Voice> {
    return this.prisma.voice.create({
      data: {
        providerId,
        ...data,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: updateVoiceInput): Promise<Voice> {
    return this.prisma.voice.update({
      where: { id },
      data,
      include: {
        provider: true,
      },
    });
  }

  async resetDefaultVoicesForProvider(providerId: number): Promise<{ count: number }> {
    return this.prisma.voice.updateMany({
      where: { providerId },
      data: { isDefault: false },
    });
  }

  async deleteById(id: number): Promise<Voice> {
    return this.prisma.voice.delete({
      where: { id },
      include: {
        provider: true,
      },
    });
  }
}
