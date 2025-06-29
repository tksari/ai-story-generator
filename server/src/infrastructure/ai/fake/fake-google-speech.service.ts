import { inject, injectable } from "tsyringe";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import {
  SpeechGenerationParams,
  SpeechGenerationResult,
} from "@/providers/interfaces/speech.provider";
import { Voice } from "@prisma/client";
import * as googleTTS from "google-tts-api";

@injectable()
export class FakeGoogleSpeechService {
  constructor(
    @inject("LogService") private logService: LogService,
    @inject("RequestLogService") private requestLogService: RequestLogService
  ) {}

  async generateSpeech(
    params: SpeechGenerationParams,
    voice: Voice
  ): Promise<SpeechGenerationResult> {
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
      const text = params.text;

      const runSpeechApi = this.requestLogService.createLogger();

      return await runSpeechApi<SpeechGenerationResult>(
        "ai",
        "fake-azure-speech.synthesize",
        "POST",
        {
          provider: "fake-azure",
          voiceId: voiceSettings.voiceId,
          language: voiceSettings.language,
          format: voiceSettings.format,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          input: params.text,
        },
        async () => {
          const audioBase64 = await googleTTS.getAudioBase64(text, {
            lang: language.substring(0, 2),
            slow: false,
            host: "https://translate.google.com",
            timeout: 10000,
          });

          const fakeAudioBuffer = Buffer.from(audioBase64, "base64");

          return {
            file: fakeAudioBuffer,
            format: voiceSettings.format,
            metadata: {
              provider: "fake-azure",
              ...voiceSettings,
              fake: true,
              textLength: text.length,
              generatedAt: new Date().toISOString(),
            },
          };
        }
      );
    } catch (error) {
      this.logService.error(
        `Error generating speech with Fake Azure: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
