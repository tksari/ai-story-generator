import { CapabilityType } from "@prisma/client";
import { z } from "zod";

export const createCapabilitySchema = z.object({
  type: z.nativeEnum(CapabilityType),
  configOptions: z.record(z.any()).optional().default({}),
  isDefault: z.boolean().optional(),
});

export const updateCapabilitySchema = createCapabilitySchema.partial();

export type CreateCapabilityInput = z.infer<typeof createCapabilitySchema>;
export type UpdateCapabilityInput = z.infer<typeof updateCapabilitySchema>;
