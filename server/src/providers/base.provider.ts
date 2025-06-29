import type { CapabilityType, Provider, Voice } from "@prisma/client";
import { ImageGenerationParams, ImageGenerationResult } from "./interfaces/image.provider";
import { TextGenerationParams, TextGenerationResult } from "./interfaces/text-generation.provider";
import { SpeechGenerationParams, SpeechGenerationResult } from "./interfaces/speech.provider";

export abstract class BaseProvider {
  abstract initialize(provider: Provider, config?: Record<string, unknown>): void;

  abstract isConfigured(): boolean;

  abstract getCapabilities(): CapabilityType[];

  async generateImage(_params: ImageGenerationParams): Promise<ImageGenerationResult> {
    await Promise.resolve();
    throw new Error(`Image generation not supported by this provider`);
  }

  async generateText(_params: TextGenerationParams): Promise<TextGenerationResult> {
    await Promise.resolve();
    throw new Error(`Text generation not supported by this provider`);
  }

  async generateSpeech(
    _params: SpeechGenerationParams,
    _voice: Voice
  ): Promise<SpeechGenerationResult> {
    await Promise.resolve();
    throw new Error(`Speech generation not supported by this provider`);
  }

  protected handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error during ${operation}: ${errorMessage}`);
  }
}
