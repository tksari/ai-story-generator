export interface Provider {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  region?: string;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  capabilities?: Capability[];
  voices?: Voice[];
}

export enum CapabilityType {
  TEXT_TO_SPEECH = "TEXT_TO_SPEECH",
  SPEECH_TO_TEXT = "SPEECH_TO_TEXT",
  TEXT_GENERATION = "TEXT_GENERATION",
  IMAGE_GENERATION = "IMAGE_GENERATION",
}

export interface CreateProviderDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  region?: string;
  config?: Record<string, any>;
}

export interface UpdateProviderDto extends Omit<CreateProviderDto, "code"> {}

export interface Voice {
  id: number;
  providerId: number;
  name: string;
  voiceId: string;
  languages?: string[];
  gender?: string;
  style?: string;
  sampleRate?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: Provider;
}

export interface CreateVoiceDto {
  name: string;
  voiceId: string;
  languages?: string[];
  gender?: string;
  style?: string;
  sampleRate?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateVoiceDto extends Omit<CreateVoiceDto, "providerId"> {}

export interface Capability {
  id: number;
  providerId: number;
  type: CapabilityType;
  configOptions?: Record<string, any>;
  isDefault: boolean;
  provider?: Provider;
}

export interface AddCapabilityDto {
  type: CapabilityType;
  configOptions?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateCapabilityDto extends Omit<AddCapabilityDto, "type"> {}
