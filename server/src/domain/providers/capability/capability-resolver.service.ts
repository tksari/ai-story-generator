import { CapabilityType } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import type { FullProvider } from "@/types/provider.types";
import { LogService } from "@/infrastructure/logging/log.service";
import { StoryRepository } from "@/domain/story/story.repository";
import { BaseProvider } from "@/providers/base.provider";
import { CapabilityRepository } from "@/domain/providers/capability/capability.repository";

@injectable()
export class CapabilityResolverService {
  constructor(
    @inject("ProviderRepository")
    private providerRepository: ProviderRepository,
    @inject("LogService") private readonly logService: LogService,
    @inject("StoryRepository")
    private readonly storyRepository: StoryRepository,
    @inject("CapabilityRepository")
    private readonly capabilityRepository: CapabilityRepository
  ) {}

  public async findProvider(
    capability: CapabilityType,
    storyId?: number,
    providerId?: number
  ): Promise<FullProvider | null> {
    // Case 1: Direct provider ID specified
    if (providerId) {
      return this.findProviderById(providerId);
    }

    // Case 2: Story-specific provider
    if (storyId) {
      const storyProvider = await this.findProviderFromStory(storyId, capability);
      if (storyProvider) {
        return storyProvider;
      }
    }

    // Case 3: Default capability provider
    const defaultProvider = await this.findDefaultProvider(capability);
    if (defaultProvider) {
      return defaultProvider;
    }

    // Case 4: Any provider with the capability
    return this.findAnyProviderWithCapability(capability);
  }

  public async findProviderById(providerId: number): Promise<FullProvider | null> {
    const provider = await this.providerRepository.findById(providerId);

    if (!provider) {
      this.logService.warn(`Provider not found with ID: ${providerId}`);
      return null;
    }

    return provider;
  }

  public async findProviderFromStory(
    storyId: number,
    capability: CapabilityType
  ): Promise<FullProvider | null> {
    const story = await this.storyRepository.getStoryById(storyId);

    if (!story) {
      this.logService.warn(`Story not found with ID: ${storyId}`);
      return null;
    }

    const settings = this.parseStorySettings(story.settings);

    if (!settings?.providers || settings.providers.useDefaultProviders) {
      return null;
    }

    const providerIdFromStory = settings.providers.providers?.[capability];

    if (!providerIdFromStory) {
      return null;
    }

    const provider = await this.providerRepository.findById(providerIdFromStory);

    if (!provider) {
      this.logService.warn(
        `Provider specified in story settings not found with ID: ${providerIdFromStory}`
      );
    }

    return provider;
  }

  public async findDefaultProvider(capability: CapabilityType): Promise<FullProvider | null> {
    const defaultCapability =
      await this.capabilityRepository.findDefaultCapabilityByType(capability);

    if (!defaultCapability) {
      return null;
    }

    const provider = await this.providerRepository.findById(defaultCapability.providerId);

    if (!provider) {
      this.logService.warn(`Default provider not found with ID: ${defaultCapability.providerId}`);
      return null;
    }

    return provider;
  }

  public async findAnyProviderWithCapability(
    capability: CapabilityType
  ): Promise<FullProvider | null> {
    const provider = await this.providerRepository.findProvidersByCapability(capability);

    if (!provider) {
      this.logService.warn(`No provider with ${capability} capability found`);
      return null;
    }

    return provider;
  }

  public getProviderInstance(
    providerMap: Record<string, BaseProvider>,
    providerCode: string
  ): BaseProvider | null {
    const instance = providerMap[providerCode];

    if (!instance) {
      this.logService.warn(`Unsupported provider type: ${providerCode}`);
      return null;
    }

    return instance;
  }

  public parseStorySettings(settings: any): Record<string, any> | null {
    if (typeof settings !== "string") {
      return settings;
    }

    try {
      return JSON.parse(settings);
    } catch {
      return {};
    }
  }

  public parseConfigOptions(capabilityConfig: any): Record<string, any> {
    if (
      !capabilityConfig.configOptions ||
      typeof capabilityConfig.configOptions !== "object" ||
      Array.isArray(capabilityConfig.configOptions)
    ) {
      return {};
    }

    return capabilityConfig.configOptions as Record<string, any>;
  }

  public getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
