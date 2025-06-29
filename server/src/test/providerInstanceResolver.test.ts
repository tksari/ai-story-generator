import { container } from "tsyringe";
import { ProviderInstanceResolver } from "@/providers/ProviderInstanceResolver";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import { StoryRepository } from "@/domain/story/story.repository";
import { LogService } from "@/infrastructure/logging/log.service";
import { OpenAIProvider } from "@/providers/openai.provider";
import { ElevenLabsProvider } from "@/providers/elevenlabs.provider";
import { AzureSpeechProvider } from "@/providers/azure-speech.provider";
import { CapabilityType } from "@prisma/client";
import { jest } from "@jest/globals";
import { CapabilityResolverService } from "@/domain/providers/capability/capability-resolver.service";
import { ProviderFactory } from "@/providers/provider.factory";

jest.mock("@/domain/providers/provider.repository");
jest.mock("@/domain/story/story.repository");
jest.mock("@/infrastructure/logging/log.service");
jest.mock("@/providers/openai.provider");
jest.mock("@/providers/elevenlabs.provider");
jest.mock("@/providers/azure-speech.provider");
jest.mock("@/domain/providers/capability/capability-resolver.service");
jest.mock("@/providers/provider.factory");

describe("ProviderInstanceResolver", () => {
  let providerInstanceResolver: ProviderInstanceResolver;
  let mockProviderRepository: jest.Mocked<ProviderRepository>;
  let mockStoryRepository: jest.Mocked<StoryRepository>;
  let mockLogService: jest.Mocked<LogService>;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;
  let mockElevenLabsProvider: jest.Mocked<ElevenLabsProvider>;
  let mockAzureSpeechProvider: jest.Mocked<AzureSpeechProvider>;
  let mockCapabilityResolverService: jest.Mocked<CapabilityResolverService>;
  let mockProviderFactory: jest.Mocked<ProviderFactory>;

  const mockProvider = {
    id: 1,
    code: "openai",
    apiKey: "test-key",
    name: "OpenAI",
    description: null,
    isActive: true,
    apiEndpoint: null,
    region: null,
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    capabilities: [
      {
        id: 1,
        providerId: 1,
        type: CapabilityType.TEXT_GENERATION,
        configOptions: { model: "gpt-4" },
        isDefault: true,
      },
    ],
    voices: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProviderRepository = {
      findProviderById: jest.fn(),
      findDefaultCapabilityByType: jest.fn(),
      findProvidersByCapability: jest.fn(),
    } as any;

    mockStoryRepository = {
      getStoryById: jest.fn(),
    } as any;

    mockLogService = {
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockOpenAIProvider = {
      initialize: jest.fn(),
      isConfigured: jest.fn(),
      getCapabilities: jest.fn(),
    } as any;

    mockElevenLabsProvider = {
      initialize: jest.fn(),
      isConfigured: jest.fn(),
      getCapabilities: jest.fn(),
    } as any;

    mockAzureSpeechProvider = {
      initialize: jest.fn(),
      isConfigured: jest.fn(),
      getCapabilities: jest.fn(),
    } as any;

    mockCapabilityResolverService = {
      resolveCapability: jest.fn().mockImplementation(() => {
        return { model: "gpt-4" };
      }),
      getErrorMessage: jest.fn().mockImplementation((error: unknown) => {
        return error instanceof Error ? error.message : String(error);
      }),
      findProvider: jest.fn().mockImplementation(() => {
        return mockProvider;
      }),
      parseConfigOptions: jest.fn().mockImplementation(() => {
        return { model: "gpt-4" };
      }),
    } as any;

    mockProviderFactory = {
      getProviderInstance: jest.fn().mockImplementation((code) => {
        if (code === "openai") {
          return mockOpenAIProvider;
        }
        return null;
      }),
      isValidProviderCode: jest.fn().mockImplementation((code) => {
        return code === "openai";
      }),
    } as any;

    container.register("ProviderRepository", {
      useValue: mockProviderRepository,
    });
    container.register("StoryRepository", { useValue: mockStoryRepository });
    container.register("LogService", { useValue: mockLogService });
    container.register("OpenAIProvider", { useValue: mockOpenAIProvider });
    container.register("ElevenLabsProvider", {
      useValue: mockElevenLabsProvider,
    });
    container.register("AzureSpeechProvider", {
      useValue: mockAzureSpeechProvider,
    });
    container.register("CapabilityResolverService", {
      useValue: mockCapabilityResolverService,
    });
    container.register("ProviderFactory", { useValue: mockProviderFactory });

    providerInstanceResolver = container.resolve(ProviderInstanceResolver);
  });

  describe("resolveInstance", () => {
    it("should return provider when providerId is specified", async () => {
      mockCapabilityResolverService.findProvider.mockResolvedValue(mockProvider);
      mockProviderFactory.getProviderInstance.mockReturnValue(mockOpenAIProvider);

      const result = await providerInstanceResolver.resolveInstance(
        CapabilityType.TEXT_GENERATION,
        undefined,
        1
      );

      expect(result?.instance).toBe(mockOpenAIProvider);
      expect(result?.provider).toEqual(mockProvider);
      expect(mockOpenAIProvider.initialize).toHaveBeenCalledWith(mockProvider, {
        model: "gpt-4",
      });
      expect(mockCapabilityResolverService.findProvider).toHaveBeenCalledWith(
        CapabilityType.TEXT_GENERATION,
        undefined,
        1
      );
    });

    it("should return provider from story settings when storyId is specified", async () => {
      mockCapabilityResolverService.findProvider.mockResolvedValue(mockProvider);
      mockProviderFactory.getProviderInstance.mockReturnValue(mockOpenAIProvider);

      const result = await providerInstanceResolver.resolveInstance(
        CapabilityType.TEXT_GENERATION,
        1
      );

      expect(result?.instance).toBe(mockOpenAIProvider);
      expect(result?.provider).toEqual(mockProvider);
      expect(mockOpenAIProvider.initialize).toHaveBeenCalledWith(mockProvider, {
        model: "gpt-4",
      });
      expect(mockCapabilityResolverService.findProvider).toHaveBeenCalledWith(
        CapabilityType.TEXT_GENERATION,
        1,
        undefined
      );
    });

    it("should return default provider when no specific provider is found", async () => {
      mockCapabilityResolverService.findProvider.mockResolvedValue(mockProvider);
      mockProviderFactory.getProviderInstance.mockReturnValue(mockOpenAIProvider);

      const result = await providerInstanceResolver.resolveInstance(CapabilityType.TEXT_GENERATION);

      expect(result?.instance).toBe(mockOpenAIProvider);
      expect(result?.provider).toEqual(mockProvider);
      expect(mockOpenAIProvider.initialize).toHaveBeenCalledWith(mockProvider, {
        model: "gpt-4",
      });
      expect(mockCapabilityResolverService.findProvider).toHaveBeenCalledWith(
        CapabilityType.TEXT_GENERATION,
        undefined,
        undefined
      );
    });

    it("should return null when no provider is found", async () => {
      mockCapabilityResolverService.findProvider.mockResolvedValue(null);
      mockProviderFactory.getProviderInstance.mockReturnValue(null);

      const result = await providerInstanceResolver.resolveInstance(CapabilityType.TEXT_GENERATION);

      expect(result).toBeNull();
      expect(mockCapabilityResolverService.findProvider).toHaveBeenCalledWith(
        CapabilityType.TEXT_GENERATION,
        undefined,
        undefined
      );
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Test error");
      mockCapabilityResolverService.findProvider.mockRejectedValue(error);
      mockCapabilityResolverService.getErrorMessage.mockReturnValue("Test error");

      const result = await providerInstanceResolver.resolveInstance(
        CapabilityType.TEXT_GENERATION,
        undefined,
        1
      );

      expect(result).toBeNull();
      expect(mockLogService.error).toHaveBeenCalledWith("Error resolving provider: Test error");
      expect(mockCapabilityResolverService.findProvider).toHaveBeenCalledWith(
        CapabilityType.TEXT_GENERATION,
        undefined,
        1
      );
    });
  });
});
