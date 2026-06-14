import { z } from "zod";

export const SCOUT_CLIP_CAPTION_MAX = 280;

export const createScoutClipSchema = z.object({
  videoUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "Video links must use https"),
  thumbnailUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "Thumbnail links must use https")
    .optional()
    .or(z.literal("")),
  caption: z.string().trim().min(1, "Add a short caption").max(SCOUT_CLIP_CAPTION_MAX),
  position: z.string().trim().max(40).optional().or(z.literal("")),
  skillTags: z.array(z.string().trim().min(1).max(28)).max(8).default([]),
});

export type CreateScoutClipInput = z.infer<typeof createScoutClipSchema>;
