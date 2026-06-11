import type { SupabaseClient } from "@supabase/supabase-js";

export const POST_LIMIT = { max: 5, windowMinutes: 10 };
export const COMMENT_LIMIT = { max: 20, windowMinutes: 10 };

/**
 * DB-backed rate limit: counts the author's recent rows. Survives serverless
 * cold starts and multiple instances, unlike in-memory counters. Uses the
 * service client so the check can't be bypassed by RLS quirks.
 */
export async function isRateLimited(
  service: SupabaseClient,
  table: "posts" | "post_comments",
  authorId: string,
  limit: { max: number; windowMinutes: number }
): Promise<boolean> {
  const since = new Date(Date.now() - limit.windowMinutes * 60_000).toISOString();
  const { count, error } = await service
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId)
    .gte("created_at", since);
  // Fail open on count errors — better to let a post through than block everyone.
  if (error) return false;
  return (count ?? 0) >= limit.max;
}

export const RATE_LIMIT_MESSAGE = "You're posting too fast — take a breather and try again in a few minutes.";
