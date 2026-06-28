import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";
import { PLACEHOLDER_ORGANIZERS } from "@/lib/feed/organizers";
import { PLACEHOLDER_ORGANIZER_SEEDS } from "@/lib/seed/placeholder-organizers";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function placeholderProfile(id: string): Profile | null {
  const placeholder = PLACEHOLDER_ORGANIZERS.find((entry) => entry.id === id);
  if (!placeholder) return null;

  return {
    id,
    email: null,
    full_name: placeholder.full_name,
    avatar_url: placeholder.avatar_url ?? null,
    role: "organizer",
    bio: null,
    nationality: null,
    position: null,
    preferred_foot: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export interface ResolvedOrganizer {
  profile: Profile;
  organizerId: string;
  isPlaceholder: boolean;
}

/** Resolve organizer hub target from UUID, organization slug, or legacy placeholder slug. */
export async function resolveOrganizer(
  supabase: SupabaseClient,
  id: string
): Promise<ResolvedOrganizer | null> {
  if (isUuid(id)) {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (data) {
      return { profile: data as Profile, organizerId: data.id, isPlaceholder: false };
    }
  }

  const seeded = PLACEHOLDER_ORGANIZER_SEEDS.find((entry) => entry.slug === id);
  if (seeded) {
    const { data: byEmail } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", seeded.email)
      .maybeSingle();

    if (byEmail) {
      return {
        profile: byEmail as Profile,
        organizerId: byEmail.id,
        isPlaceholder: false,
      };
    }
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, verified, created_by")
    .eq("slug", id)
    .maybeSingle();

  if (organization?.created_by) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", organization.created_by)
      .maybeSingle();

    if (owner) {
      return {
        profile: {
          ...(owner as Profile),
          full_name: organization.name ?? owner.full_name,
          avatar_url: organization.logo_url ?? owner.avatar_url,
        },
        organizerId: owner.id,
        isPlaceholder: false,
      };
    }
  }

  const legacy = placeholderProfile(id);
  if (legacy) {
    return { profile: legacy, organizerId: legacy.id, isPlaceholder: true };
  }

  return null;
}
