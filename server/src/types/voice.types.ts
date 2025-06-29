import { z } from "zod";

export const createVoiceSchema = z.object({
  name: z.string().min(2).max(100),
  languages: z.array(z.string()).optional(),
  voiceId: z.string().min(1),
  gender: z.string().optional(),
  style: z.string().optional(),
  sampleRate: z.number().int().positive().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateVoiceSchema = createVoiceSchema.partial();

export type createVoiceInput = z.infer<typeof createVoiceSchema>;
export type updateVoiceInput = z.infer<typeof updateVoiceSchema>;
