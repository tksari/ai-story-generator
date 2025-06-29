import { PrismaClient, Provider, CapabilityType } from "@prisma/client";
import type {
  CreateProviderInput,
  FullProvider,
  UpdateProviderInput,
} from "@/types/provider.types";
import { inject, injectable } from "tsyringe";

@injectable()
export class ProviderRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async getAll(includeInactive: boolean = false): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async findById(id: number): Promise<FullProvider | null> {
    return this.prisma.provider.findUnique({
      where: { id },
      include: {
        capabilities: true,
      },
    });
  }

  async findProviderByCode(code: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { code },
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async findProvidersByCapability(
    type: CapabilityType,
    includeInactive: boolean = false
  ): Promise<FullProvider | null> {
    return this.prisma.provider.findFirst({
      where: {
        capabilities: {
          some: { type },
        },
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async create(data: CreateProviderInput): Promise<Provider> {
    return this.prisma.provider.create({
      data,
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async updateById(id: number, data: UpdateProviderInput): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id },
      data,
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async deleteById(id: number): Promise<Provider> {
    return this.prisma.provider.delete({
      where: { id },
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }
}
