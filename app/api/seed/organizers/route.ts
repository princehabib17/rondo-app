import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  PLACEHOLDER_ORGANIZER_SEEDS,
  buildGamesForOrganizer,
  type OrganizerSeed,
} from "@/lib/seed/placeholder-organizers";

const TEAM_COLORS = [
  { name: "Reds", color: "#ef4444", slot_number: 1 },
  { name: "Blues", color: "#3b82f6", slot_number: 2 },
];

const DEFAULT_PASSWORD = "OrganizerSeed123!";

async function ensureOrganizerProfile(
  service: ReturnType<typeof createServiceClient>,
  seed: OrganizerSeed
): Promise<string> {
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", seed.email)
    .maybeSingle();

  const baseProfile = {
    full_name: seed.full_name,
    role: "organizer" as const,
    avatar_url: seed.avatar_url,
    bio: seed.bio,
    preferred_areas: seed.preferred_areas,
    game_preference: seed.game_preference,
  };

  const extendedProfile = {
    ...baseProfile,
    phone: seed.phone ?? null,
    organizer_verified: seed.verified,
  };

  if (existingProfile?.id) {
    const { error: extendedErr } = await service
      .from("profiles")
      .update(extendedProfile)
      .eq("id", existingProfile.id);

    if (extendedErr) {
      const { error: baseErr } = await service
        .from("profiles")
        .update(baseProfile)
        .eq("id", existingProfile.id);
      if (baseErr) {
        throw new Error(`Failed to update profile for ${seed.email}: ${baseErr.message}`);
      }
    }

    return existingProfile.id;
  }

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: seed.email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: seed.full_name, avatar_url: seed.avatar_url },
  });

  if (createErr || !created.user) {
    throw new Error(`Failed to create ${seed.email}: ${createErr?.message ?? "unknown error"}`);
  }

  const userId = created.user.id;

  const { error: profileErr } = await service.from("profiles").upsert(
    {
      id: userId,
      email: seed.email,
      ...extendedProfile,
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    const { error: fallbackErr } = await service.from("profiles").upsert(
      {
        id: userId,
        email: seed.email,
        ...baseProfile,
      },
      { onConflict: "id" }
    );
    if (fallbackErr) {
      throw new Error(`Failed to upsert profile for ${seed.email}: ${fallbackErr.message}`);
    }
  }

  return userId;
}

async function ensureOrganization(
  service: ReturnType<typeof createServiceClient>,
  seed: OrganizerSeed,
  createdBy: string
): Promise<string | null> {
  try {
    const { data: existing, error: existingErr } = await service
      .from("organizations")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();

    if (existingErr) return null;

    if (existing?.id) {
      await service
        .from("organizations")
        .update({
          name: seed.organizationName,
          logo_url: seed.avatar_url,
          verified: seed.verified,
        })
        .eq("id", existing.id);

      await service.from("organization_members").upsert(
        {
          organization_id: existing.id,
          user_id: createdBy,
          role: "owner",
          status: "active",
          approved_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,user_id" }
      );

      return existing.id;
    }

    const { data: organization, error } = await service
      .from("organizations")
      .insert({
        name: seed.organizationName,
        slug: seed.slug,
        logo_url: seed.avatar_url,
        verified: seed.verified,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error || !organization) return null;

    await service.from("organization_members").insert({
      organization_id: organization.id,
      user_id: createdBy,
      role: "owner",
      status: "active",
      approved_at: new Date().toISOString(),
    });

    return organization.id;
  } catch {
    return null;
  }
}

async function insertGame(
  service: ReturnType<typeof createServiceClient>,
  game: ReturnType<typeof buildGamesForOrganizer>[number],
  organizationId: string | null
) {
  const { match_type } = game;
  const baseGame: Omit<typeof game, "organization_id" | "match_type"> = {
    organizer_id: game.organizer_id,
    title: game.title,
    description: game.description,
    venue_name: game.venue_name,
    venue_address: game.venue_address,
    venue_lat: game.venue_lat,
    venue_lng: game.venue_lng,
    date_time: game.date_time,
    price_per_player: game.price_per_player,
    max_players: game.max_players,
    num_teams: game.num_teams,
    format: game.format,
    round_duration_minutes: game.round_duration_minutes,
    payment_type: game.payment_type,
    status: game.status,
    registration_open: game.registration_open,
    banner_url: game.banner_url,
  };
  const withOrg = organizationId ? { ...baseGame, organization_id: organizationId } : baseGame;
  const fullGame = match_type ? { ...withOrg, match_type } : withOrg;

  const attempts = [fullGame, withOrg, baseGame];

  for (const payload of attempts) {
    const { data: createdGame, error: gameErr } = await service
      .from("games")
      .insert(payload)
      .select("id")
      .single();

    if (!gameErr && createdGame) {
      return createdGame.id;
    }

    const lastError = gameErr?.message ?? "unknown error";
    if (payload === baseGame) {
      throw new Error(`Failed to create game "${game.title}": ${lastError}`);
    }
  }

  throw new Error(`Failed to create game "${game.title}"`);
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
    }

    // Fail closed: without SEED_SECRET this endpoint is unauthenticated (proxy.ts
    // exempts /api/seed from auth), so refuse to run rather than allow public access.
    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
      return NextResponse.json(
        { error: "Seed endpoint disabled: SEED_SECRET is not configured" },
        { status: 503 }
      );
    }
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${seedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const weeksAhead = typeof body.weeksAhead === "number" ? body.weeksAhead : 3;

    const service = createServiceClient();
    const results: string[] = [];
    let totalGames = 0;

    for (const seed of PLACEHOLDER_ORGANIZER_SEEDS) {
      const organizerId = await ensureOrganizerProfile(service, seed);
      const organizationId = await ensureOrganization(service, seed, organizerId);

      const { error: deleteErr } = await service.from("games").delete().eq("organizer_id", organizerId);
      if (deleteErr) {
        return NextResponse.json(
          { error: `Failed to clear games for ${seed.slug}: ${deleteErr.message}` },
          { status: 500 }
        );
      }

      const gameRows = buildGamesForOrganizer(
        organizerId,
        organizationId ?? "00000000-0000-0000-0000-000000000000",
        seed,
        weeksAhead
      );

      for (const game of gameRows) {
        const gameId = await insertGame(service, game, organizationId);

        const { error: teamsErr } = await service.from("teams").insert(
          TEAM_COLORS.map((team) => ({
            ...team,
            game_id: gameId,
          }))
        );

        if (teamsErr) {
          return NextResponse.json(
            { error: `Failed to create teams for "${game.title}": ${teamsErr.message}` },
            { status: 500 }
          );
        }

        totalGames += 1;
      }

      results.push(`${seed.full_name}: ${gameRows.length} upcoming games`);
    }

    return NextResponse.json({
      ok: true,
      organizers: PLACEHOLDER_ORGANIZER_SEEDS.length,
      games: totalGames,
      weeksAhead,
      results,
      note: "Organizer logins use *@organizers.rondo with password OrganizerSeed123! (dev seed only).",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
