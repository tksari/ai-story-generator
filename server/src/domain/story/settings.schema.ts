import { z } from "zod";
import {
  resolutionOptions,
  fpsOptions,
  videoCodecOptions,
  audioCodecOptions,
  qualityOptions,
  transitionOptions,
} from "@/domain/shared/generation/default-generation-settings";
import { zodFromOptions, zodFromOptionsNumberOrString } from "../../utils/zod.helpers";

export const settingsSchema = z.object({
  video: z.object({
    resolution: zodFromOptions(resolutionOptions),
    fps: zodFromOptionsNumberOrString(fpsOptions).transform((v) =>
      typeof v === "number" ? v : parseInt(v)
    ),
    format: z.enum(["mp4", "mov", "webm"]).default("mp4"),
    codec: zodFromOptions(videoCodecOptions),
    quality: zodFromOptions(qualityOptions),
    bitrate: z.string().regex(/^\d+k$/),
    pixel_format: z.string(),
  }),
  audio: z.object({
    codec: zodFromOptions(audioCodecOptions),
    bitrate: z.string().regex(/^\d+k$/),
    sample_rate: z.union([z.number(), z.string().transform((v) => parseInt(v))]),
    channels: z.union([z.number(), z.string().transform((v) => parseInt(v))]),
    normalization: z.boolean().default(false),
  }),
  layout: z.object({ id: z.string() }).nullable(),
  background: z.object({
    type: z.enum(["color", "image", "gradient"]),
    color: z.string().nullable(),
    image: z.string().nullable(),
    fit: z.enum(["cover", "contain", "fill"]),
    gradientType: z.enum(["linear", "radial"]).nullable().default("linear"),
    gradientStart: z.string().nullable(),
    gradientEnd: z.string().nullable(),
    gradientAngle: z.number().nullable().default(0),
    opacity: z.number().min(0).max(100).default(100),
  }),
  transitions: z
    .object({
      enabled: z.boolean(),
      type: zodFromOptions(transitionOptions),
      duration: z.number().min(0),
    })
    .optional(),
  backgroundMusic: z
    .object({
      enabled: z.boolean(),
      volume: z.number().min(0).max(1),
      fadeIn: z.number().min(0),
      fadeOut: z.number().min(0),
      file: z.string().nullable(),
    })
    .optional(),
  performance: z
    .object({
      threads: z.number().min(0),
      maxCpuUsage: z.number().min(0).max(100),
      preset: zodFromOptions(qualityOptions),
    })
    .optional(),
  gaps: z
    .object({
      startSilence: z.number().min(0),
      betweenSilence: z.number().min(0),
      endSilence: z.number().min(0),
    })
    .optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
