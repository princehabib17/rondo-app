import { createServiceClient } from "@/lib/supabase/service";
import { ensureOrganizerProfile, runPlaceholderCity } from "@/lib/seed/run-placeholder-city";
import { SHOWCASE_ORGANIZER, ensureShowcaseTournaments } from "@/lib/seed/showcase-tournaments";

let inflight: Promise<{ seeded: boolean }> | null = null;
// Tournaments only need checking once per server instance; the feed calls
// this on every visit to a city with no open brackets nearby.
let showcaseChecked = false;

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

async function countTournaments(): Promise<number> {
  const service = createServiceClient();
  const { count, error } = await service
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .neq("status", "cancelled");

  // Unknown is not empty: never seed on a failed read.
  if (error) return 1;
  return count ?? 0;
}

async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { seeded: false };
  }

  let seeded = false;
  try {
    if ((await countOpenGames()) === 0) {
      await runPlaceholderCity({
        weeksAhead: 2,
        organizerLimit: 1,
        maxGames: 4,
      });
      seeded = true;
    }
  } catch {
    // Games are best effort; the showcase below is independent.
  }

  try {
    if (!showcaseChecked && (await countTournaments()) === 0) {
      const service = createServiceClient();
      const organizerId = await ensureOrganizerProfile(service, SHOWCASE_ORGANIZER);
      seeded = (await ensureShowcaseTournaments(service, organizerId)) > 0 || seeded;
    }
    showcaseChecked = true;
  } catch {
    // A failed showcase only means an empty tournaments tab, never a broken feed.
  }

  return { seeded };
}

/** First visitor of an empty city gets a few real Metro Manila listings and the showcase cups. */
export function ensurePublishedCity(): Promise<{ seeded: boolean }> {
  if (!inflight) {
    inflight = seedIfEmpty().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
