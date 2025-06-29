import { Page } from "@prisma/client";
import { z } from "zod";

export const createPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  content: z.string().min(1),
});

export const updatePageSchema = z.object({
  newIndex: z.number().int().min(0).optional(),
  content: z.string().min(1),
});

export const updatePageOrderSchema = z.object({
  newIndex: z.number().int().min(0),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type UpdatePageOrderInput = z.infer<typeof updatePageOrderSchema>;
