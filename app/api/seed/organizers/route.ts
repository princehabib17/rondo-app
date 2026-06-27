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

  if (existingProfile?.id) {
    await service
      .from("profiles")
      .update({
        full_name: seed.full_name,
        role: "organizer",
        avatar_url: seed.avatar_url,
        bio: seed.bio,
        phone: seed.phone ?? null,
        organizer_verified: seed.verified,
        preferred_areas: seed.preferred_areas,
        game_preference: seed.game_preference,
      })
      .eq("id", existingProfile.id);

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
      full_name: seed.full_name,
      role: "organizer",
      avatar_url: seed.avatar_url,
      bio: seed.bio,
      phone: seed.phone ?? null,
      organizer_verified: seed.verified,
      preferred_areas: seed.preferred_areas,
      game_preference: seed.game_preference,
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    throw new Error(`Failed to upsert profile for ${seed.email}: ${profileErr.message}`);
  }

  return userId;
}

async function ensureOrganization(
  service: ReturnType<typeof createServiceClient>,
  seed: OrganizerSeed,
  createdBy: string
): Promise<string> {
  const { data: existing } = await service
    .from("organizations")
    .select("id")
    .eq("slug", seed.slug)
    .maybeSingle();

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

  if (error || !organization) {
    throw new Error(`Failed to create organization ${seed.slug}: ${error?.message ?? "unknown error"}`);
  }

  const { error: memberErr } = await service.from("organization_members").insert({
    organization_id: organization.id,
    user_id: createdBy,
    role: "owner",
    status: "active",
    approved_at: new Date().toISOString(),
  });

  if (memberErr) {
    throw new Error(`Failed to add owner for ${seed.slug}: ${memberErr.message}`);
  }

  return organization.id;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${seedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    const gameRows = buildGamesForOrganizer(organizerId, organizationId, seed, weeksAhead);

    for (const game of gameRows) {
      const { data: createdGame, error: gameErr } = await service
        .from("games")
        .insert(game)
        .select("id")
        .single();

      if (gameErr || !createdGame) {
        return NextResponse.json(
          { error: `Failed to create game "${game.title}": ${gameErr?.message ?? "unknown error"}` },
          { status: 500 }
        );
      }

      const { error: teamsErr } = await service.from("teams").insert(
        TEAM_COLORS.map((team) => ({
          ...team,
          game_id: createdGame.id,
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
}
