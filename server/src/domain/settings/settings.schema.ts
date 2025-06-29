import z from "zod";

export const settingsSchema = z.object({
  apiBaseUrl: z.string().url().default("http://localhost:3000"),
  useFakeProvider: z.boolean().default(true),
  theme: z.enum(["light", "dark", "system"]).default("light"),
});

export const updateSettingsSchema = settingsSchema.partial();

export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
