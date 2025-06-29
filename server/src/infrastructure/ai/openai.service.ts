import { inject, injectable } from "tsyringe";
import OpenAI from "openai";
import { LogService } from "@/infrastructure/logging/log.service";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import {
  ImageGenerationParams,
  ImageGenerationResult,
} from "@/providers/interfaces/image.provider";
import {
  TextGenerationParams,
  TextGenerationResult,
} from "@/providers/interfaces/text-generation.provider";
import { Provider } from "@prisma/client";
import { FakeOpenAIService } from "@/infrastructure/ai/fake/fake-openai.service";
import { SettingsService } from "@/domain/settings/settings.service";

@injectable()
export class OpenAIService {
  private providerName: string;
  private openai: OpenAI;
  private apiKey: string;
  private isInitialized: boolean = false;
  private readonly DEFAULT_MODEL = "gpt-4";
  private readonly DEFAULT_IMAGE_MODEL = "dall-e-3";
  private readonly SUPPORTED_IMAGE_SIZES = ["1024x1024", "1792x1024", "1024x1792"];

  constructor(
    @inject("LogService") private logService: LogService,
    @inject("RequestLogService") private requestLogService: RequestLogService,
    @inject("FakeOpenAIService") private fakeOpenAIService: FakeOpenAIService,
    @inject("SettingsService") private settingsService: SettingsService
  ) {}

  initialize(provider: Provider, config?: Record<string, any>): void {
    const { apiKey } = provider;

    if (!apiKey) {
      throw new Error("OpenAI service requires a valid apiKey in config");
    }

    this.providerName = provider.name;
    this.apiKey = apiKey;
    this.openai = new OpenAI({ apiKey });
    this.isInitialized = true;
    this.logService.debug("OpenAI service initialized");
  }

  isConfigured(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  private validateConfiguration(): void {
    if (!this.isConfigured()) {
      throw new Error("OpenAI service is not properly configured");
    }
  }

  private validatePrompt(prompt: string): void {
    if (!prompt?.trim()) {
      throw new Error("Prompt is required");
    }
  }

  private handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logService.error(`Error in OpenAI ${operation}: ${errorMessage}`);
    throw new Error(`OpenAI ${operation} failed: ${errorMessage}`);
  }

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    try {
      if (await this.settingsService.getUseFakeProvider()) {
        this.logService.debug("Using fake OpenAI service for text generation");
        return await this.fakeOpenAIService.generateText(params);
      }

      this.validateConfiguration();
      this.validatePrompt(params.prompt);

      const runTextApi = this.requestLogService.createLogger();
      return await runTextApi<TextGenerationResult>(
        "ai",
        "openai.completions.create",
        "POST",
        {
          provider: this.providerName,
          prompt: params.prompt,
          maxTokens: params.maxTokens,
          temperature: params.temperature,
          model: params.model || this.DEFAULT_MODEL,
        },
        async () => {
          const messages = [
            {
              role: "system" as const,
              content: params.systemPrompt || "You are a helpful assistant.",
            },
            { role: "user" as const, content: params.prompt },
          ];

          const response = await this.openai.chat.completions.create({
            model: params.model || this.DEFAULT_MODEL,
            messages,
            max_tokens: params.maxTokens,
            temperature: params.temperature,
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content returned from OpenAI");
          }

          return {
            text: content,
            metadata: {
              provider: this.providerName,
              model: params.model || this.DEFAULT_MODEL,
              prompt: params.prompt,
              systemPrompt: params.systemPrompt,
              usage: response.usage,
            },
          };
        }
      );
    } catch (error) {
      this.handleError(error, "text generation");
    }
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      if (await this.settingsService.getUseFakeProvider()) {
        this.logService.debug("Using fake OpenAI service for image generation");
        return await this.fakeOpenAIService.generateImage(params);
      }

      this.validateConfiguration();
      this.validatePrompt(params.prompt);
      const imageSize = this.getImageSize(params.width, params.height);
      const runImageApi = this.requestLogService.createLogger();

      return await runImageApi<ImageGenerationResult>(
        "ai",
        "openai.images.generate",
        "POST",
        {
          provider: this.providerName,
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          quality: params.quality || "standard",
          size: imageSize,
        },
        async () => {
          const response = await this.openai.images.generate({
            model: this.DEFAULT_IMAGE_MODEL,
            prompt: params.prompt,
            n: 1,
            quality: (params.quality || "standard") as any,
            response_format: "url",
            size: imageSize as any,
            style: "vivid",
          });

          this.logService.debug("OpenAI image generation response:", {
            created: response.created,
            hasData: !!response.data,
            dataLength: response.data?.length,
            firstItemUrl: response.data?.[0]?.url,
          });

          const imageData = response.data?.[0];
          if (!imageData?.url) {
            throw new Error("No image URL returned from OpenAI");
          }

          const dimensions = this.parseImageSize(imageSize);

          return {
            path: imageData.url,
            format: "png",
            metadata: {
              provider: this.providerName,
              model: this.DEFAULT_IMAGE_MODEL,
              prompt: params.prompt,
              revisedPrompt: imageData.revised_prompt,
              width: dimensions.width,
              height: dimensions.height,
            },
          };
        }
      );
    } catch (error) {
      this.handleError(error, "image generation");
    }
  }

  private getImageSize(width?: number, height?: number): string {
    if (!width || !height) {
      return "1024x1024";
    }

    const size = `${width}x${height}`;
    if (this.SUPPORTED_IMAGE_SIZES.includes(size)) {
      return size;
    }

    this.logService.warn(`Unsupported image size: ${size}, using default: 1024x1024`);
    return "1024x1024";
  }

  private parseImageSize(size: string): { width: number; height: number } {
    const [width, height] = size.split("x").map(Number);
    if (isNaN(width) || isNaN(height)) {
      throw new Error(`Invalid image size format: ${size}`);
    }
    return { width, height };
  }
}
