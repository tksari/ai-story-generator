import { container } from "tsyringe";
import { FakeOpenAIService } from "@/infrastructure/ai/fake/fake-openai.service";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";

jest.mock("@/infrastructure/logging/log.service");
jest.mock("@/domain/request-log/request-log.service");

describe("Fake OpenAI Service", () => {
  let fakeOpenAIService: FakeOpenAIService;
  let mockLogService: jest.Mocked<LogService>;
  let mockRequestLogService: jest.Mocked<RequestLogService>;

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

    fakeOpenAIService = container.resolve(FakeOpenAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Text Generation", () => {
    it("should generate fake text response", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "Write a story",
        maxTokens: 100,
        temperature: 0.7,
      });

      expect(result).toBeDefined();
      expect(result.text).toContain("PAGE_1_START");
      expect(result.text).toContain("PAGE_1_END");
      expect(result.text).toContain("This is the content of page 1");
      expect(result.metadata.provider).toBe("fake-openai");
      expect(result.metadata.model).toBe("gpt-4-fake");
      expect(result.metadata.prompt).toBe("Write a story");
      expect(result.metadata.usage).toBeDefined();
      expect(result.metadata.usage.prompt_tokens).toBe(13);
      expect(result.metadata.usage.completion_tokens).toBeGreaterThan(0);
      expect(result.metadata.usage.total_tokens).toBeGreaterThan(12);

      expect(mockRequestLogService.createLogger).toHaveBeenCalled();
    });

    it("should handle different prompt types", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "Create a list",
        maxTokens: 50,
      });

      expect(result.text).toContain("PAGE_1_START");
      expect(result.text).toContain("PAGE_10_END");
      expect(result.text).toContain("This is the content of page");
      expect(result.metadata.prompt).toBe("Create a list");
    });

    it("should generate multiple pages", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "Explain this topic",
        maxTokens: 50,
      });

      for (let i = 1; i <= 10; i++) {
        expect(result.text).toContain(`PAGE_${i}_START`);
        expect(result.text).toContain(`PAGE_${i}_END`);
        expect(result.text).toContain(`This is the content of page ${i}`);
      }
    });

    it("should handle custom model parameter", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "Test custom model",
        maxTokens: 50,
        model: "gpt-3.5-turbo-fake",
      });

      expect(result.metadata.model).toBe("gpt-3.5-turbo-fake");
    });

    it("should handle system prompt", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "Test with system prompt",
        maxTokens: 50,
        systemPrompt: "You are a helpful assistant",
      });

      expect(result.metadata.systemPrompt).toBe("You are a helpful assistant");
    });

    it("should calculate correct token usage", async () => {
      const prompt = "Short prompt";
      const result = await fakeOpenAIService.generateText({
        prompt,
        maxTokens: 50,
      });

      expect(result.metadata.usage.prompt_tokens).toBe(prompt.length);
      expect(result.metadata.usage.completion_tokens).toBe(result.text.length);
      expect(result.metadata.usage.total_tokens).toBe(prompt.length + result.text.length);
    });
  });

  describe("Image Generation", () => {
    it("should generate fake image URL", async () => {
      const result = await fakeOpenAIService.generateImage({
        prompt: "A beautiful landscape",
        width: 1024,
        height: 1024,
      });

      expect(result).toBeDefined();
      expect(result.path).toContain("picsum.photos");
      expect(result.format).toBe("png");
      expect(result.metadata.provider).toBe("fake-openai");
      expect(result.metadata.model).toBe("dall-e-3-fake");
      expect(result.metadata.prompt).toBe("A beautiful landscape");
      expect(result.metadata.revisedPrompt).toContain(
        "Fake revised prompt for: A beautiful landscape"
      );
      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(1024);

      expect(mockRequestLogService.createLogger).toHaveBeenCalled();
    });

    it("should handle different image prompts", async () => {
      const result = await fakeOpenAIService.generateImage({
        prompt: "Cat picture",
        width: 512,
        height: 512,
      });

      expect(result.path).toContain("picsum.photos");
      expect(result.metadata.width).toBe(512);
      expect(result.metadata.height).toBe(512);
      expect(result.metadata.prompt).toBe("Cat picture");
    });

    it("should use default dimensions when not provided", async () => {
      const result = await fakeOpenAIService.generateImage({
        prompt: "Default dimensions",
      });

      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(1024);
    });

    it("should handle negative prompt", async () => {
      const result = await fakeOpenAIService.generateImage({
        prompt: "Positive prompt",
        negativePrompt: "Negative prompt",
        width: 1024,
        height: 1024,
      });

      expect(result.metadata.prompt).toBe("Positive prompt");
      // Note: negativePrompt is not stored in metadata in the current implementation
    });

    it("should handle quality parameter", async () => {
      const result = await fakeOpenAIService.generateImage({
        prompt: "High quality image",
        quality: "hd",
        width: 1024,
        height: 1024,
      });

      expect(result.metadata).toBeDefined();
      // Note: quality is not stored in metadata in the current implementation
    });

    it("should generate consistent URLs for same prompt", async () => {
      const prompt = "Consistent test prompt";

      const result1 = await fakeOpenAIService.generateImage({
        prompt,
        width: 1024,
        height: 1024,
      });

      const result2 = await fakeOpenAIService.generateImage({
        prompt,
        width: 1024,
        height: 1024,
      });

      expect(result1.path).toBe(result2.path);
    });

    it("should generate different URLs for different prompts", async () => {
      const result1 = await fakeOpenAIService.generateImage({
        prompt: "First prompt",
        width: 1024,
        height: 1024,
      });

      const result2 = await fakeOpenAIService.generateImage({
        prompt: "Second prompt",
        width: 1024,
        height: 1024,
      });

      expect(result1.path).not.toBe(result2.path);
    });
  });

  describe("Request Logging", () => {
    it("should log text generation requests", async () => {
      await fakeOpenAIService.generateText({
        prompt: "Test logging",
        maxTokens: 50,
      });

      expect(mockRequestLogService.createLogger).toHaveBeenCalled();
    });

    it("should log image generation requests", async () => {
      await fakeOpenAIService.generateImage({
        prompt: "Test image logging",
        width: 1024,
        height: 1024,
      });

      expect(mockRequestLogService.createLogger).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle empty prompt gracefully", async () => {
      const result = await fakeOpenAIService.generateText({
        prompt: "",
        maxTokens: 50,
      });

      expect(result).toBeDefined();
      expect(result.metadata.prompt).toBe("");
      expect(result.metadata.usage.prompt_tokens).toBe(0);
    });

    it("should handle very long prompts", async () => {
      const longPrompt = "A".repeat(1000);
      const result = await fakeOpenAIService.generateText({
        prompt: longPrompt,
        maxTokens: 50,
      });

      expect(result).toBeDefined();
      expect(result.metadata.usage.prompt_tokens).toBe(1000);
    });
  });
});
