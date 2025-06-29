export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  quality?: "standard" | "hd";
  storyId?: number;
}

export interface ImageGenerationResult {
  path: string;
  format: string;
  metadata: {
    provider: string;
    model: string;
    prompt: string;
    revisedPrompt?: string;
    width: number;
    height: number;
  };
}

export interface ImageProviderInterface {
  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
}
