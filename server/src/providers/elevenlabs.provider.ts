import { inject, injectable } from "tsyringe";
import { CapabilityType, Provider } from "@prisma/client";
import { BaseProvider } from "./base.provider";
import { SpeechGenerationParams, SpeechGenerationResult } from "./interfaces/speech.provider";
import { Voice } from "@prisma/client";
import { LogService } from "@/infrastructure/logging/log.service";
import { ElevenLabsService } from "@/infrastructure/ai/elevenlabs.service";

@injectable()
export class ElevenLabsProvider extends BaseProvider {
  private isInitialized: boolean = false;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("ElevenLabsService")
    private elevenLabsService: ElevenLabsService
  ) {
    super();
  }

  initialize(povider: Provider, config?: Record<string, any>): void {
    this.elevenLabsService.initialize(povider, config);
    this.isInitialized = true;
    this.logService.debug("ElevenLabs provider initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && this.elevenLabsService.isConfigured();
  }

  getCapabilities(): CapabilityType[] {
    return [CapabilityType.TEXT_TO_SPEECH];
  }

  async generateSpeech(
    params: SpeechGenerationParams,
    voice: Voice
  ): Promise<SpeechGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error("ElevenLabs provider is not properly configured");
    }

    try {
      return await this.elevenLabsService.generateSpeech(params, voice);
    } catch (error) {
      this.logService.error(
        `Error in ElevenLabs provider: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
