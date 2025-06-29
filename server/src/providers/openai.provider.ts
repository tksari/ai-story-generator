import { inject, injectable } from "tsyringe";
import { CapabilityType, Provider } from "@prisma/client";
import { BaseProvider } from "./base.provider";
import { ImageGenerationParams, ImageGenerationResult } from "./interfaces/image.provider";
import { TextGenerationParams, TextGenerationResult } from "./interfaces/text-generation.provider";
import { OpenAIService } from "@/infrastructure/ai/openai.service";
import { LogService } from "@/infrastructure/logging/log.service";

@injectable()
export class OpenAIProvider extends BaseProvider {
  private isInitialized: boolean = false;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("OpenAIService") private openAIService: OpenAIService
  ) {
    super();
  }

  initialize(povider: Provider, config?: Record<string, any>): void {
    this.openAIService.initialize(povider, config);
    this.isInitialized = true;
    this.logService.debug("OpenAI provider initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && this.openAIService.isConfigured();
  }

  getCapabilities(): CapabilityType[] {
    return [
      CapabilityType.IMAGE_GENERATION,
      CapabilityType.TEXT_GENERATION,
      CapabilityType.EMBEDDINGS,
    ];
  }

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI provider is not properly configured");
    }

    try {
      return await this.openAIService.generateText(params);
    } catch (error) {
      this.logService.error(
        `Error in OpenAI provider text generation: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI provider is not properly configured");
    }

    try {
      return await this.openAIService.generateImage(params);
    } catch (error) {
      this.logService.error(
        `Error in OpenAI provider image generation: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
