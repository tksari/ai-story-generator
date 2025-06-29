import { inject, injectable } from "tsyringe";
import { CapabilityType, Provider } from "@prisma/client";
import { BaseProvider } from "./base.provider";
import { SpeechGenerationParams, SpeechGenerationResult } from "./interfaces/speech.provider";
import { AzureSpeechService } from "@/infrastructure/ai/azure-speech.service";
import { Voice } from "@prisma/client";
import { LogService } from "@/infrastructure/logging/log.service";

@injectable()
export class AzureSpeechProvider extends BaseProvider {
  private isInitialized: boolean = false;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("AzureSpeechService")
    private azureSpeechService: AzureSpeechService
  ) {
    super();
  }

  initialize(povider: Provider, config?: Record<string, any>): void {
    this.azureSpeechService.initialize(povider, config);
    this.isInitialized = true;
    this.logService.debug("Azure Speech provider initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && this.azureSpeechService.isConfigured();
  }

  getCapabilities(): CapabilityType[] {
    return [CapabilityType.TEXT_TO_SPEECH];
  }

  async generateSpeech(
    params: SpeechGenerationParams,
    voice: Voice
  ): Promise<SpeechGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error("Azure Speech provider is not properly configured");
    }

    try {
      return await this.azureSpeechService.generateSpeech(params, voice);
    } catch (error) {
      this.logService.error(
        `Error in Azure Speech provider: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
