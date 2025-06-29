import z from "zod";

const baseVideoSchema = z.object({
  storyId: z.number().positive(),
});

export const generatedVideoSchema = baseVideoSchema;
export type GeneratedVideoInput = z.infer<typeof generatedVideoSchema>;
