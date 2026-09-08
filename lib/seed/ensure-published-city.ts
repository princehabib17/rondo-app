import { createServiceClient } from "@/lib/supabase/service";
import { runPlaceholderCity } from "@/lib/seed/run-placeholder-city";

let inflight: Promise<{ seeded: boolean }> | null = null;

async function countOpenGames(): Promise<number> {
  const service = createServiceClient();
  const { count, error } = await service
    .from("games")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .gte("date_time", new Date().toISOString());

  if (error) return 0;
  return count ?? 0;
}

async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { seeded: false };
  }

  try {
    if ((await countOpenGames()) > 0) {
      return { seeded: false };
    }

    await runPlaceholderCity({
      weeksAhead: 2,
      organizerLimit: 1,
      maxGames: 4,
    });
    return { seeded: true };
  } catch {
    return { seeded: false };
  }
}

/** First visitor of an empty city gets a few real Metro Manila listings. */
export function ensurePublishedCity(): Promise<{ seeded: boolean }> {
  if (!inflight) {
    inflight = seedIfEmpty().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
