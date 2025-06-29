export interface SpeechGenerationParams {
  text: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  outputFormat?: string;
  pageId?: number;
  languages?: string[];
  rate?: number;
  pitch?: number;
  extraParams?: Record<string, any>;
  path?: string;
}

export interface SpeechGenerationResult {
  file: Buffer;
  format: string;
  metadata: Record<string, any>;
}

export interface SpeechProviderInterface {
  generateSpeech(params: SpeechGenerationParams): Promise<SpeechGenerationResult>;
}
