import { container } from "tsyringe";
import { FakeGoogleSpeechService } from "@/infrastructure/ai/fake/fake-google-speech.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import { Voice } from "@prisma/client";

jest.mock("@/infrastructure/logging/log.service");
jest.mock("@/domain/request-log/request-log.service");
jest.mock("google-tts-api");

describe("Fake Google Speech Service", () => {
  let fakeGoogleSpeechService: FakeGoogleSpeechService;
  let mockLogService: jest.Mocked<LogService>;
  let mockRequestLogService: jest.Mocked<RequestLogService>;

  const mockVoice: Voice = {
    id: 1,
    providerId: 1,
    voiceId: "en-US-JennyNeural",
    name: "Jenny",
    gender: "Female",
    languages: ["en-US"],
    style: null,
    sampleRate: null,
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockLogService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    const mockLogger = jest
      .fn()
      .mockImplementation(async (category, endpoint, method, data, fn) => {
        return await fn();
      });

    mockRequestLogService = {
      createLogger: jest.fn().mockReturnValue(mockLogger),
    } as any;

    container.register("LogService", { useValue: mockLogService });
    container.register("RequestLogService", {
      useValue: mockRequestLogService,
    });

    fakeGoogleSpeechService = container.resolve(FakeGoogleSpeechService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Speech Generation", () => {
    it("should generate speech using Google TTS API", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Hello world, this is a test speech.",
          rate: 1.0,
          pitch: 1.0,
        },
        mockVoice
      );

      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(Buffer);
      expect(result.format).toBe("audio-24khz-96kbitrate-mono-mp3");
      expect(result.metadata.provider).toBe("fake-azure");
      expect(result.metadata.voiceId).toBe("en-US-JennyNeural");
      expect(result.metadata.fake).toBe(true);
      expect(result.metadata.textLength).toBe(35);
      expect(result.metadata.generatedAt).toBeDefined();

      expect(googleTTS.getAudioBase64).toHaveBeenCalledWith("Hello world, this is a test speech.", {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
        timeout: 10000,
      });

      expect(mockRequestLogService.createLogger).toHaveBeenCalled();
    }, 10000);

    it("should handle different text lengths", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const shortText = "Hi";
      const longText =
        "This is a very long text that should generate a longer audio buffer. It contains multiple sentences and should result in a different duration.";

      const shortResult = await fakeGoogleSpeechService.generateSpeech(
        {
          text: shortText,
        },
        mockVoice
      );

      const longResult = await fakeGoogleSpeechService.generateSpeech(
        {
          text: longText,
        },
        mockVoice
      );

      expect(shortResult.metadata.textLength).toBe(2);
      expect(longResult.metadata.textLength).toBe(142);
      expect(shortResult.file.length).toBe(longResult.file.length); // Same mock data
    }, 15000);

    it("should handle different voice settings", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const customVoice: Voice = {
        ...mockVoice,
        voiceId: "en-US-GuyNeural",
        gender: "Male",
        languages: ["en-US", "en-GB"],
      };

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Test with custom voice settings",
          rate: 1.5,
          pitch: 0.8,
        },
        customVoice
      );

      expect(result.metadata.voiceId).toBe("en-US-GuyNeural");
      expect(result.metadata.rate).toBe("1.5%");
      expect(result.metadata.pitch).toBe("0.8%");
    }, 10000);

    it("should handle empty text error", async () => {
      await expect(
        fakeGoogleSpeechService.generateSpeech(
          {
            text: "",
          },
          mockVoice
        )
      ).rejects.toThrow("Text is required to generate speech");

      await expect(
        fakeGoogleSpeechService.generateSpeech(
          {
            text: "   ",
          },
          mockVoice
        )
      ).rejects.toThrow("Text is required to generate speech");
    });

    it("should handle different languages", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const britishVoice: Voice = {
        ...mockVoice,
        languages: ["en-GB"],
      };

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Hello world",
          languages: ["en-GB"],
        },
        britishVoice
      );

      expect(result.metadata.language).toBe("en-GB");
      expect(googleTTS.getAudioBase64).toHaveBeenCalledWith(
        "Hello world",
        expect.objectContaining({
          lang: "en",
        })
      );
    }, 10000);

    it("should generate consistent audio buffer for same input", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const text = "Consistent test text";
      const params = { text, rate: 1.0, pitch: 1.0 };

      const result1 = await fakeGoogleSpeechService.generateSpeech(params, mockVoice);
      const result2 = await fakeGoogleSpeechService.generateSpeech(params, mockVoice);

      expect(result1.file.length).toBe(result2.file.length);
      expect(result1.metadata.textLength).toBe(result2.metadata.textLength);
    }, 15000);

    it("should include all required metadata", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Test metadata",
          rate: 1.2,
          pitch: 0.9,
        },
        mockVoice
      );

      expect(result.metadata).toMatchObject({
        provider: "fake-azure",
        voiceId: "en-US-JennyNeural",
        language: "en-US",
        format: "audio-24khz-96kbitrate-mono-mp3",
        rate: "1.2%",
        pitch: "0.9%",
        fake: true,
        textLength: 13,
        generatedAt: expect.any(String),
      });
    }, 10000);
  });

  describe("Error Handling", () => {
    it("should handle Google TTS API errors gracefully", async () => {
      const googleTTS = require("google-tts-api");
      googleTTS.getAudioBase64.mockRejectedValue(new Error("Google TTS API error"));

      await expect(
        fakeGoogleSpeechService.generateSpeech(
          {
            text: "Test error handling",
          },
          mockVoice
        )
      ).rejects.toThrow("Google TTS API error");

      expect(mockLogService.error).toHaveBeenCalledWith(
        expect.stringContaining("Error generating speech with Fake Azure")
      );
    });

    it("should handle network timeout errors", async () => {
      const googleTTS = require("google-tts-api");
      googleTTS.getAudioBase64.mockRejectedValue(new Error("Network timeout"));

      await expect(
        fakeGoogleSpeechService.generateSpeech(
          {
            text: "Test timeout",
          },
          mockVoice
        )
      ).rejects.toThrow("Network timeout");
    });
  });

  describe("Language Handling", () => {
    it("should use first language from params if available", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Test language",
          languages: ["fr-FR", "en-US"],
        },
        mockVoice
      );

      expect(result.metadata.language).toBe("fr-FR");
      expect(googleTTS.getAudioBase64).toHaveBeenCalledWith(
        "Test language",
        expect.objectContaining({
          lang: "fr",
        })
      );
    });

    it("should fallback to voice language if no params language", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Test fallback",
        },
        mockVoice
      );

      expect(result.metadata.language).toBe("en-US");
      expect(googleTTS.getAudioBase64).toHaveBeenCalledWith(
        "Test fallback",
        expect.objectContaining({
          lang: "en",
        })
      );
    });

    it("should use default language if no language available", async () => {
      const googleTTS = require("google-tts-api");
      const mockAudioBase64 = "fake-audio-base64-data";
      googleTTS.getAudioBase64.mockResolvedValue(mockAudioBase64);

      const voiceWithoutLanguage: Voice = {
        ...mockVoice,
        languages: [],
      };

      const result = await fakeGoogleSpeechService.generateSpeech(
        {
          text: "Test default",
        },
        voiceWithoutLanguage
      );

      expect(result.metadata.language).toBe("en-US");
      expect(googleTTS.getAudioBase64).toHaveBeenCalledWith(
        "Test default",
        expect.objectContaining({
          lang: "en",
        })
      );
    });
  });
});
