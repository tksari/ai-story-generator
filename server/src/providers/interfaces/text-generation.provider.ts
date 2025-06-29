export interface TextGenerationParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  storyId?: number;
}

export interface TextGenerationResult {
  text: string;
  metadata: {
    provider: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    usage?: any;
  };
}

export interface TextGenerationProviderInterface {
  generateText(params: TextGenerationParams): Promise<TextGenerationResult>;
}
