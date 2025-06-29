import { inject, injectable } from "tsyringe";
import axios from "axios";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import {
  SpeechGenerationParams,
  SpeechGenerationResult,
} from "@/providers/interfaces/speech.provider";
import { Provider, Voice } from "@prisma/client";
import { FakeGoogleSpeechService } from "@/infrastructure/ai/fake/fake-google-speech.service";
import { SettingsService } from "@/domain/settings/settings.service";

@injectable()
export class ElevenLabsService {
  private providerName: string;
  private apiEndpoint: string;
  private apiKey: string;
  private config: Record<string, any> = {};
  private isInitialized: boolean = false;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("SettingsService") private settingsService: SettingsService,
    @inject("RequestLogService") private requestLogService: RequestLogService,
    @inject("FakeGoogleSpeechService") private fakeGoogleSpeechService: FakeGoogleSpeechService
  ) {}

  initialize(provider: Provider, config?: Record<string, any>): void {
    const { apiKey, apiEndpoint } = provider;

    if (!apiKey || !apiEndpoint) {
      throw new Error("ElevenLabs service requires a valid apiKey and apiEndpoint");
    }

    this.providerName = provider.name;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.config = config || {};
    this.isInitialized = true;
    this.logService.debug("ElevenLabs service initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  private validateSpeechParams(params: SpeechGenerationParams): void {
    if (!params.text) {
      throw new Error("Text is required for speech generation");
    }
  }

  async generateSpeech(
    params: SpeechGenerationParams,
    voice: Voice
  ): Promise<SpeechGenerationResult> {
    if (await this.settingsService.getUseFakeProvider()) {
      this.logService.debug("Using fake Azure Speech service for speech generation");
      return await this.fakeGoogleSpeechService.generateSpeech(params, voice);
    }

    if (!this.isConfigured() && !voice && !this.config?.apiSuffix) {
      throw new Error("ElevenLabs service is not properly configured");
    }

    this.validateSpeechParams(params);

    try {
      const runSpeechApi = this.requestLogService.createLogger();

      const { voiceId } = voice;
      const { modelId, apiSuffix } = this.config;

      return await runSpeechApi<SpeechGenerationResult>(
        "ai",
        "elevenlabs.text-to-speech.convert",
        "POST",
        {
          provider: this.providerName,
          text: params.text,
          voiceId,
          modelId,
        },
        async () => {
          const response = await axios({
            method: "post",
            url: `${this.apiEndpoint}/${apiSuffix}/${voiceId}`,
            headers: {
              "xi-api-key": `${this.apiKey}`,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            data: {
              text: params.text,
              model_id: modelId,
            },
            responseType: "arraybuffer",
          });

          if (!response.data) {
            throw new Error("No audio data returned from ElevenLabs");
          }

          return {
            file: response.data,
            format: "mp3",
            metadata: {
              provider: this.providerName,
              model: modelId,
              voiceId: voiceId,
              text: params.text,
            },
          };
        }
      );
    } catch (error) {
      this.logService.error(
        `Error generating speech with ElevenLabs: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
