import { inject, injectable } from "tsyringe";
import axios from "axios";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import {
  SpeechGenerationParams,
  SpeechGenerationResult,
} from "@/providers/interfaces/speech.provider";
import { sanitizeText } from "@/utils/index";
import { Provider, Voice } from "@prisma/client";
import { FakeGoogleSpeechService } from "@/infrastructure/ai/fake/fake-google-speech.service";
import { SettingsService } from "@/domain/settings/settings.service";

@injectable()
export class AzureSpeechService {
  private providerName: string;
  private apiKey: string = "";
  private apiEndpoint: string = "";
  private region: string = "";
  private isInitialized: boolean = false;

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("RequestLogService") private requestLogService: RequestLogService,
    @inject("FakeGoogleSpeechService") private fakeGoogleSpeechService: FakeGoogleSpeechService,
    @inject("SettingsService") private settingsService: SettingsService
  ) {}

  initialize(provider: Provider, config?: Record<string, any>): void {
    const { apiKey, apiEndpoint, region } = provider;

    if (!apiKey || !apiEndpoint || !region) {
      throw new Error(
        "Azure Speech service requires a valid apiKey, apiEndpoint, and region in config"
      );
    }

    this.providerName = provider.name;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.region = region;
    this.isInitialized = true;
    this.logService.debug("Azure Speech service initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && !!this.apiKey && !!this.apiEndpoint && !!this.region;
  }

  async generateSpeech(
    params: SpeechGenerationParams,
    voice: Voice
  ): Promise<SpeechGenerationResult> {
    if (await this.settingsService.getUseFakeProvider()) {
      this.logService.debug("Using fake Azure Speech service for speech generation");
      return await this.fakeGoogleSpeechService.generateSpeech(params, voice);
    }

    if (!this.isConfigured()) {
      throw new Error("Azure Speech service is not properly configured");
    }

    if (!params?.text || params.text.trim() === "") {
      throw new Error("Text is required to generate speech");
    }

    const language =
      (params.languages as string[])?.[0] ?? (voice.languages as string[])?.[0] ?? "en-US";

    try {
      const config = {
        voiceId: voice.voiceId,
        language: language,
        format: "audio-24khz-96kbitrate-mono-mp3",
        rate: params.rate !== undefined ? `${params.rate}%` : "medium",
        pitch: params.pitch !== undefined ? `${params.pitch}%` : "medium",
      };

      const voiceSettings = { ...voice, ...config };
      const text = sanitizeText(params.text);

      const ssml = `
                <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${voiceSettings.language}'>
                <voice xml:lang="${voiceSettings.language}" name="${voiceSettings.voiceId}" xml:gender='${voiceSettings.gender}'>
                    <prosody rate='${voiceSettings.rate}' pitch='${voiceSettings.pitch}'>
                    ${text}
                    </prosody>
                </voice>
                </speak>
            `;

      const API = `https://${this.region}.${this.apiEndpoint}`;

      const runSpeechApi = this.requestLogService.createLogger();

      return await runSpeechApi<SpeechGenerationResult>(
        "ai",
        API,
        "POST",
        {
          provider: this.providerName,
          voiceId: voiceSettings.voiceId,
          language: voiceSettings.language,
          format: voiceSettings.format,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          input: params.text,
        },
        async () => {
          const response = await axios({
            method: "post",
            url: API,
            headers: {
              "Ocp-Apim-Subscription-Key": this.apiKey,
              "Content-Type": "application/ssml+xml",
              "X-Microsoft-OutputFormat": voiceSettings.format,
              "User-Agent": "AI Content Production App",
            },
            data: ssml,
            responseType: "arraybuffer",
          });

          return {
            file: response.data,
            format: voiceSettings.format,
            metadata: {
              provider: this.providerName,
              ...voiceSettings,
            },
          };
        }
      );
    } catch (error) {
      this.logService.error(
        `Error generating speech with Azure: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
