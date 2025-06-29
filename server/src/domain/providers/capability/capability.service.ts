import { inject, injectable } from "tsyringe";

import { ProviderCapability, CapabilityType } from "@prisma/client";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import { CapabilityRepository } from "@/domain/providers/capability/capability.repository";
import { CreateCapabilityInput, UpdateCapabilityInput } from "@/types/capability.types";

@injectable()
export class CapabilityService {
  constructor(
    @inject("ProviderRepository")
    private providerRepository: ProviderRepository,
    @inject("CapabilityRepository")
    private capabilityRepository: CapabilityRepository
  ) {}

  async getCapabilitiesByProviderId(providerId: number): Promise<ProviderCapability[]> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    return this.capabilityRepository.findCapabilitiesByProviderId(providerId);
  }

  async create(providerId: number, data: CreateCapabilityInput): Promise<ProviderCapability> {
    const provider = await this.providerRepository.findById(providerId);

    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    await this.ensureProviderDoesNotHaveCapability(providerId, data.type, provider.name);

    if (data.isDefault) {
      await this.capabilityRepository.removeDefaultFromCapabilitiesOfType(data.type);
    }

    return this.capabilityRepository.create(providerId, data);
  }

  async update(id: number, data: UpdateCapabilityInput): Promise<ProviderCapability | null> {
    const capability = await this.capabilityRepository.findById(id);

    if (!capability) {
      throw new Error(`Capability with ID ${id} not found`);
    }

    if (data.isDefault) {
      await this.capabilityRepository.removeDefaultFromCapabilitiesOfType(capability.type);
    }

    await this.capabilityRepository.update(id, data);

    return await this.capabilityRepository.findById(id);
  }

  async delete(capabilityId: number): Promise<void> {
    const capability = await this.capabilityRepository.findById(capabilityId);

    if (!capability) {
      throw new Error(`Capability with ID ${capabilityId} not found`);
    }

    await this.capabilityRepository.delete(capabilityId);
  }

  private async ensureProviderDoesNotHaveCapability(
    providerId: number,
    type: CapabilityType,
    providerName: string
  ): Promise<void> {
    const existingCapabilities =
      await this.capabilityRepository.findCapabilitiesByProviderId(providerId);
    const hasCapability = existingCapabilities.some((cap) => cap.type === type);

    if (hasCapability) {
      throw new Error(`Provider ${providerName} already has ${type} capability`);
    }
  }
}
