import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizerGroup } from "@/lib/feed/organizers";
import { PLACEHOLDER_ORGANIZER_SEEDS } from "@/lib/seed/placeholder-organizers";
import type { Profile } from "@/lib/supabase/types";

const SLUG_BY_EMAIL = Object.fromEntries(
  PLACEHOLDER_ORGANIZER_SEEDS.map((seed) => [seed.email, seed.slug])
) as Record<string, string>;

type OrganizerRow = Profile & { games?: { id: string }[] };

export async function fetchTopOrganizers(
  supabase: SupabaseClient,
  limit = 20
): Promise<OrganizerGroup[]> {
  const extended = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, organizer_verified, games!organizer_id(id)")
    .eq("role", "organizer")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows =
    !extended.error && extended.data
      ? (extended.data as OrganizerRow[])
      : ((
          await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url, games!organizer_id(id)")
            .eq("role", "organizer")
            .order("created_at", { ascending: false })
            .limit(limit)
        ).data as OrganizerRow[] | null);

  // No invented brands here: when nobody real has hosted a game yet, the
  // caller shows an honest empty state instead of fictional organizer cards.
  return (
    rows
      ?.filter((profile) => (profile.games?.length ?? 0) > 0)
      .map((profile) => ({
        id: SLUG_BY_EMAIL[profile.email ?? ""] ?? profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        verified: profile.organizer_verified ?? true,
      })) ?? []
  );
}
