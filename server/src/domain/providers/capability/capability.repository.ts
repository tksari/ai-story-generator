import { PrismaClient, ProviderCapability, CapabilityType } from "@prisma/client";
import type { FullProvider } from "@/types/provider.types";
import { inject, injectable } from "tsyringe";
import { CreateCapabilityInput, UpdateCapabilityInput } from "@/types/capability.types";

@injectable()
export class CapabilityRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async findById(id: number): Promise<ProviderCapability | null> {
    return this.prisma.providerCapability.findUnique({
      where: { id },
    });
  }

  async findCapabilityByType(
    type: CapabilityType,
    includeInactive: boolean = false
  ): Promise<FullProvider | null> {
    return this.prisma.provider.findFirst({
      where: {
        capabilities: {
          some: { type: type },
        },
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        capabilities: true,
        voices: true,
      },
    });
  }

  async findCapabilitiesByProviderId(providerId: number): Promise<ProviderCapability[]> {
    return this.prisma.providerCapability.findMany({
      where: { providerId },
      include: {
        provider: true,
      },
    });
  }

  async findDefaultCapabilityByType(type: CapabilityType): Promise<ProviderCapability | null> {
    return this.prisma.providerCapability.findFirst({
      where: {
        type,
        isDefault: true,
      },
      include: {
        provider: true,
      },
    });
  }

  async create(providerId: number, data: CreateCapabilityInput): Promise<ProviderCapability> {
    return this.prisma.providerCapability.create({
      data: {
        providerId,
        ...data,
      },
      include: {
        provider: true,
      },
    });
  }

  async update(id: number, data: UpdateCapabilityInput): Promise<ProviderCapability> {
    return this.prisma.providerCapability.update({
      where: { id },
      data,
      include: {
        provider: true,
      },
    });
  }

  async removeDefaultFromCapabilitiesOfType(type: CapabilityType): Promise<{ count: number }> {
    return this.prisma.providerCapability.updateMany({
      where: { type },
      data: { isDefault: false },
    });
  }

  async delete(id: number): Promise<ProviderCapability> {
    return this.prisma.providerCapability.delete({
      where: { id },
    });
  }
}
