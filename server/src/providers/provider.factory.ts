import { OpenAIProvider } from "./openai.provider";
import { ElevenLabsProvider } from "./elevenlabs.provider";
import { AzureSpeechProvider } from "./azure-speech.provider";
import { BaseProvider } from "./base.provider";
import { LogService } from "@/infrastructure/logging/log.service";
import { container } from "tsyringe";
import { injectable, inject } from "tsyringe";

export enum ProviderCode {
  OPENAI = "openai",
  ELEVENLABS = "elevenlabs",
  AZURE = "azure",
}

@injectable()
export class ProviderFactory {
  constructor(
    @inject("LogService") private logService: LogService,
    @inject("OpenAIProvider") private openAIProvider: OpenAIProvider,
    @inject("ElevenLabsProvider")
    private elevenLabsProvider: ElevenLabsProvider,
    @inject("AzureSpeechProvider")
    private azureSpeechProvider: AzureSpeechProvider
  ) {}

  private providerMap: Record<ProviderCode, () => BaseProvider> = {
    [ProviderCode.OPENAI]: () => this.openAIProvider,
    [ProviderCode.ELEVENLABS]: () => this.elevenLabsProvider,
    [ProviderCode.AZURE]: () => this.azureSpeechProvider,
  };

  getProviderInstance(code: string): BaseProvider | null {
    try {
      const providerCode = code as ProviderCode;
      const factory = this.providerMap[providerCode];

      if (!factory) {
        this.logService.warn(`Unknown provider code requested: ${code}`);
        return null;
      }

      return factory();
    } catch (error) {
      this.logService.error(`Error creating provider instance for code ${code}:`, error);
      return null;
    }
  }

  isValidProviderCode(code: string): boolean {
    return Object.values(ProviderCode).includes(code as ProviderCode);
  }
}

export function getProviderInstance(code: string): BaseProvider | null {
  const factory = container.resolve(ProviderFactory);
  return factory.getProviderInstance(code);
}
