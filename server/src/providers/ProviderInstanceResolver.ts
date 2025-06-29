import { inject, injectable } from "tsyringe";
import { CapabilityType, Provider } from "@prisma/client";
import { LogService } from "@/infrastructure/logging/log.service";
import { BaseProvider } from "./base.provider";
import { ProviderFactory } from "./provider.factory";
import { CapabilityResolverService } from "@/domain/providers/capability/capability-resolver.service";

export interface ProviderWithInfo {
  instance: BaseProvider;
  provider: Provider;
}

@injectable()
export class ProviderInstanceResolver {
  constructor(
    @inject("CapabilityResolverService")
    private readonly capabilityResolverService: CapabilityResolverService,
    @inject("LogService") private readonly logService: LogService,
    @inject("ProviderFactory")
    private readonly providerFactory: ProviderFactory
  ) {}

  /**
   * Resolves a provider instance based on capability type and context (story or provider ID)
   *
   * @param capability - The type of capability required
   * @param storyId - Optional story ID to check for story-specific provider settings
   * @param providerId - Optional provider ID to directly specify a provider
   * @returns Promise resolving to provider with info or null if not found
   */
  public async resolveInstance(
    capability: CapabilityType,
    storyId?: number,
    providerId?: number
  ): Promise<ProviderWithInfo | null> {
    try {
      const provider = await this.capabilityResolverService.findProvider(
        capability,
        storyId,
        providerId
      );

      if (!provider) {
        return null;
      }

      const capabilityConfig = provider.capabilities.find((cap) => cap.type === capability);

      if (!capabilityConfig) {
        this.logService.warn(`Provider ${provider.name} does not have ${capability} capability`);
        return null;
      }

      const instance = this.providerFactory.getProviderInstance(provider.code);

      if (!instance) {
        return null;
      }

      const configOptions = this.capabilityResolverService.parseConfigOptions(capabilityConfig);
      instance.initialize(provider, configOptions);

      return { instance: instance, provider: provider };
    } catch (error) {
      this.logService.error(
        `Error resolving provider: ${this.capabilityResolverService.getErrorMessage(error)}`
      );
      return null;
    }
  }

  public async resolveInstancesForCapabilities(
    capabilities: CapabilityType[]
  ): Promise<Record<CapabilityType, ProviderWithInfo | null>> {
    const result: Partial<Record<CapabilityType, ProviderWithInfo | null>> = {};

    for (const capability of capabilities) {
      result[capability] = await this.resolveInstance(capability);
    }

    return result as Record<CapabilityType, ProviderWithInfo | null>;
  }
}
