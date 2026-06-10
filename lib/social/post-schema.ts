import { z } from "zod";

export const POST_BODY_MAX = 2000;
export const COMMENT_BODY_MAX = 500;

export const createPostSchema = z.object({
  body: z.string().trim().min(1, "Say something first").max(POST_BODY_MAX),
  kind: z.enum(["post", "highlight", "match_result"]).default("post"),
  gameId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  mediaUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "Media links must use https")
    .optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Say something first").max(COMMENT_BODY_MAX),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
