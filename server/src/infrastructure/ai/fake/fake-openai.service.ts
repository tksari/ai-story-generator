import { inject, injectable } from "tsyringe";
import { RequestLogService } from "@/domain/request-log/request-log.service";
import {
  ImageGenerationParams,
  ImageGenerationResult,
} from "@/providers/interfaces/image.provider";
import {
  TextGenerationParams,
  TextGenerationResult,
} from "@/providers/interfaces/text-generation.provider";

@injectable()
export class FakeOpenAIService {
  private readonly DEFAULT_MODEL = "gpt-4-fake";
  private readonly DEFAULT_IMAGE_MODEL = "dall-e-3-fake";

  constructor(@inject("RequestLogService") private requestLogService: RequestLogService) {}

  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    const runTextApi = this.requestLogService.createLogger();

    return await runTextApi<TextGenerationResult>(
      "ai",
      "fake-openai.completions.create",
      "POST",
      {
        provider: "fake-openai",
        prompt: params.prompt,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
        model: params.model || this.DEFAULT_MODEL,
      },
      async () => {
        const fakeResponse = this.generateFakeTextResponse(params.prompt, params.systemPrompt);

        return {
          text: fakeResponse,
          metadata: {
            provider: "fake-openai",
            model: params.model || this.DEFAULT_MODEL,
            prompt: params.prompt,
            systemPrompt: params.systemPrompt,
            usage: {
              prompt_tokens: params.prompt.length,
              completion_tokens: fakeResponse.length,
              total_tokens: params.prompt.length + fakeResponse.length,
            },
          },
        };
      }
    );
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const runImageApi = this.requestLogService.createLogger();

    return await runImageApi<ImageGenerationResult>(
      "ai",
      "fake-openai.images.generate",
      "POST",
      {
        provider: "fake-openai",
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        quality: params.quality || "standard",
        width: params.width || 1024,
        height: params.height || 1024,
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));

        const fakeImageUrl = this.generateFakeImageUrl(params.prompt);

        return {
          path: fakeImageUrl,
          format: "png",
          metadata: {
            provider: "fake-openai",
            model: this.DEFAULT_IMAGE_MODEL,
            prompt: params.prompt,
            revisedPrompt: `Fake revised prompt for: ${params.prompt}`,
            width: params.width || 1024,
            height: params.height || 1024,
          },
        };
      }
    );
  }

  private generateFakeTextResponse(prompt: string, systemPrompt?: string): string {
    const pageCount = 10;
    let result = "";

    for (let i = 0; i < pageCount; i++) {
      result += `PAGE_${i + 1}_START\nThis is the content of page ${i + 1}.\nPAGE_${i + 1}_END\n\n`;
    }

    return result;
  }

  private generateFakeImageUrl(prompt: string): string {
    const baseUrls = [
      "https://picsum.photos/1024/1024?random=1",
      "https://picsum.photos/1024/1024?random=2",
      "https://picsum.photos/1024/1024?random=3",
      "https://picsum.photos/1024/1024?random=4",
      "https://picsum.photos/1024/1024?random=5",
    ];

    const hash = prompt.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return baseUrls[Math.abs(hash) % baseUrls.length];
  }
}
