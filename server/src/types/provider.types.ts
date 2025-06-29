import type { Provider, ProviderCapability } from "@prisma/client";
import { z } from "zod";

export type FullProvider = Provider & {
  capabilities: ProviderCapability[];
};

export const createProviderSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  apiKey: z.string().optional(),
  apiEndpoint: z.string().optional(),
  region: z.string().optional(),
  config: z.record(z.any()).optional(),
});

export const updateProviderSchema = createProviderSchema.partial();

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
