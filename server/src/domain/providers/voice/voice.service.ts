import { inject, injectable } from "tsyringe";
import { Provider, Voice, CapabilityType } from "@prisma/client";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import { VoiceRepository } from "@/domain/providers/voice/voice.repository";
import { createVoiceInput, updateVoiceInput } from "@/types/voice.types";
import { CapabilityRepository } from "@/domain/providers/capability/capability.repository";

@injectable()
export class VoiceService {
  constructor(
    @inject("ProviderRepository")
    private providerRepository: ProviderRepository,
    @inject("VoiceRepository") private voiceRepository: VoiceRepository,
    @inject("CapabilityRepository")
    private capabilityRepository: CapabilityRepository
  ) {}

  async getVoicesByProviderId(
    providerId: number,
    includeInactive: boolean = false
  ): Promise<Voice[]> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    return this.voiceRepository.findManyByProviderId(providerId, includeInactive);
  }

  async update(id: number, data: updateVoiceInput): Promise<Voice> {
    const voice = await this.voiceRepository.findById(id);
    if (!voice) {
      throw new Error(`Voice with ID ${id} not found`);
    }

    if (data.isDefault) {
      await this.voiceRepository.resetDefaultVoicesForProvider(voice.providerId);
    }

    return this.voiceRepository.update(id, data);
  }

  async bulkCreateVoices(providerId: number, voices: createVoiceInput[]): Promise<void> {
    await this.ensureProviderCanCreateVoices(providerId);

    for (const voice of voices) {
      await this.voiceRepository.create(providerId, voice);
    }
  }

  async setDefaultVoice(voiceId: number): Promise<Voice> {
    const voice = await this.voiceRepository.findById(voiceId);

    if (!voice) {
      throw new Error(`Voice with ID ${voiceId} not found`);
    }

    await this.voiceRepository.resetDefaultVoicesForProvider(voice.providerId);

    return await this.voiceRepository.update(voiceId, { isDefault: true });
  }

  private async ensureProviderCanCreateVoices(providerId: number): Promise<Provider> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    const capabilities = await this.capabilityRepository.findCapabilitiesByProviderId(providerId);
    const hasTTSCapability = capabilities.some((cap) => cap.type === CapabilityType.TEXT_TO_SPEECH);

    if (!hasTTSCapability) {
      throw new Error(`Provider ${provider.name} does not support TEXT_TO_SPEECH capability`);
    }

    return provider;
  }
}
