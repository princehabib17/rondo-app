import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Seed credentials — for development and testing only
const SEED_USERS = [
  {
    email: "organizer@test.rondo",
    password: "Test1234!",
    full_name: "Carlos Dela Cruz",
    role: "organizer" as const,
    bio: "Been running 5v5 games in BGC for 3 years. All levels welcome.",
    nationality: "Filipino",
    position: "midfielder",
    preferred_foot: "right",
    skill_level: "advanced",
    preferred_areas: "BGC, Makati, Pasig",
    game_preference: "both",
  },
  {
    email: "player1@test.rondo",
    password: "Test1234!",
    full_name: "Marco Reyes",
    role: "player" as const,
    bio: "Weekend warrior. Forward by heart, striker by trade.",
    nationality: "Filipino",
    position: "forward",
    preferred_foot: "right",
    skill_level: "intermediate",
    preferred_areas: "BGC, Taguig",
    game_preference: "football",
  },
  {
    email: "player2@test.rondo",
    password: "Test1234!",
    full_name: "Ana Santos",
    role: "player" as const,
    bio: "Goalkeeper, always looking for a good squad.",
    nationality: "Filipino",
    position: "goalkeeper",
    preferred_foot: "both",
    skill_level: "intermediate",
    preferred_areas: "Makati, Mandaluyong",
    game_preference: "futsal",
  },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  // If SEED_SECRET is configured, require it as Bearer token
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${seedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const service = createServiceClient();
  const results: string[] = [];

  // ── 1. Ensure users exist ──────────────────────────────────────────
  const userIds: Record<string, string> = {};

  for (const u of SEED_USERS) {
    // Try to find existing user by email in profiles
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("email", u.email)
      .maybeSingle();

    let userId: string;

    if (existing?.id) {
      userId = existing.id;
      results.push(`Found existing user: ${u.email}`);
    } else {
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (createErr) {
        return NextResponse.json(
          { error: `Failed to create ${u.email}: ${createErr.message}` },
          { status: 500 }
        );
      }

      userId = created.user!.id;
      results.push(`Created user: ${u.email}`);
    }

    userIds[u.email] = userId;

    // Upsert profile (service role bypasses protect_profile_role trigger)
    const { error: profileErr } = await service.from("profiles").upsert(
      {
        id: userId,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        bio: u.bio,
        nationality: u.nationality,
        position: u.position,
        preferred_foot: u.preferred_foot,
        skill_level: u.skill_level,
        preferred_areas: u.preferred_areas,
        game_preference: u.game_preference,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      return NextResponse.json(
        { error: `Failed to upsert profile for ${u.email}: ${profileErr.message}` },
        { status: 500 }
      );
    }
  }

  const organizerId = userIds["organizer@test.rondo"];
  const player1Id = userIds["player1@test.rondo"];
  const player2Id = userIds["player2@test.rondo"];

  // ── 2. Clear old seed games by this organizer ──────────────────────
  await service.from("games").delete().eq("organizer_id", organizerId);
  results.push("Cleared old seed games");

  // ── 3. Create games ────────────────────────────────────────────────
  const GAMES = [
    {
      title: "BGC Pickup — 5v5 Football",
      description: "Casual 5-aside at McKinley Hill Turf. All skill levels welcome. Bring water.",
      venue_name: "McKinley Hill Turf",
      venue_address: "McKinley Hill, BGC, Taguig City",
      venue_lat: 14.5469,
      venue_lng: 121.0505,
      date_time: daysFromNow(3),
      price_per_player: 25000,
      max_players: 10,
      num_teams: 2,
      format: "5v5",
      payment_type: "online" as const,
      status: "open" as const,
    },
    {
      title: "Makati Futsal Night",
      description: "Evening futsal, floodlights on. Futsal rules. No slide tackles.",
      venue_name: "Makati Sports Hub",
      venue_address: "Ayala Ave, Makati City",
      venue_lat: 14.5547,
      venue_lng: 121.0244,
      date_time: daysFromNow(5),
      price_per_player: 30000,
      max_players: 12,
      num_teams: 2,
      format: "6v6",
      payment_type: "online" as const,
      status: "open" as const,
    },
    {
      title: "Pasig Sunday League",
      description: "Weekly Sunday game. Teams stay for the season. Show up consistently.",
      venue_name: "Pasig City Sports Complex",
      venue_address: "C. Raymundo Ave, Pasig City",
      venue_lat: 14.5764,
      venue_lng: 121.0845,
      date_time: daysFromNow(7),
      price_per_player: 20000,
      max_players: 14,
      num_teams: 2,
      format: "7v7",
      payment_type: "venue" as const,
      status: "open" as const,
    },
    {
      title: "Mandaluyong Free Kick",
      description: "Free pickup game, no fees. Just show up and run.",
      venue_name: "Mandaluyong Turf Center",
      venue_address: "Shaw Blvd, Mandaluyong City",
      venue_lat: 14.5792,
      venue_lng: 121.0359,
      date_time: daysFromNow(10),
      price_per_player: 0,
      max_players: 10,
      num_teams: 2,
      format: "5v5",
      payment_type: "venue" as const,
      status: "open" as const,
    },
  ];

  const gameIds: string[] = [];

  for (const g of GAMES) {
    const { data: game, error: gameErr } = await service
      .from("games")
      .insert({ ...g, organizer_id: organizerId })
      .select("id")
      .single();

    if (gameErr || !game) {
      return NextResponse.json(
        { error: `Failed to create game "${g.title}": ${gameErr?.message}` },
        { status: 500 }
      );
    }

    gameIds.push(game.id);
  }

  results.push(`Created ${gameIds.length} games`);

  // ── 4. Create teams for each game ──────────────────────────────────
  const TEAM_PAIRS = [
    [
      { name: "Reds", color: "#ef4444", slot_number: 1 },
      { name: "Blues", color: "#3b82f6", slot_number: 2 },
    ],
    [
      { name: "Yellows", color: "#eab308", slot_number: 1 },
      { name: "Greens", color: "#22c55e", slot_number: 2 },
    ],
    [
      { name: "Whites", color: "#f8fafc", slot_number: 1 },
      { name: "Blacks", color: "#1c1917", slot_number: 2 },
    ],
    [
      { name: "Orange", color: "#f97316", slot_number: 1 },
      { name: "Purple", color: "#a855f7", slot_number: 2 },
    ],
  ];

  const teamIdsByGame: Record<string, string[]> = {};

  for (let i = 0; i < gameIds.length; i++) {
    const gameId = gameIds[i];
    const { data: teams, error: teamsErr } = await service
      .from("teams")
      .insert(TEAM_PAIRS[i].map((t) => ({ ...t, game_id: gameId })))
      .select("id");

    if (teamsErr || !teams) {
      return NextResponse.json(
        { error: `Failed to create teams for game ${i}: ${teamsErr?.message}` },
        { status: 500 }
      );
    }

    teamIdsByGame[gameId] = teams.map((t) => t.id);
  }

  results.push("Created teams for all games");

  // ── 5. Add players to first two games ─────────────────────────────
  // Game 0 (BGC): player1 on Reds, player2 on Blues — paid
  // Game 1 (Makati): player1 on Yellows — pending payment
  const playerEntries = [
    {
      game_id: gameIds[0],
      user_id: player1Id,
      team_id: teamIdsByGame[gameIds[0]][0],
      payment_status: "paid" as const,
    },
    {
      game_id: gameIds[0],
      user_id: player2Id,
      team_id: teamIdsByGame[gameIds[0]][1],
      payment_status: "paid" as const,
    },
    {
      game_id: gameIds[1],
      user_id: player1Id,
      team_id: teamIdsByGame[gameIds[1]][0],
      payment_status: "pending_payment" as const,
    },
  ];

  const { error: playersErr } = await service.from("game_players").insert(playerEntries);

  if (playersErr) {
    return NextResponse.json(
      { error: `Failed to add players to games: ${playersErr.message}` },
      { status: 500 }
    );
  }

  results.push("Added players to games");

  // ── 6. Seed wallet transactions ────────────────────────────────────
  // Give player1 a topped-up balance and a paid game deduction
  const walletEntries = [
    {
      user_id: player1Id,
      organizer_id: null,
      game_id: null,
      amount: 100000, // ₱1,000 topup
      direction: "credit",
      source: "payment",
      note: "Top-up via GCash",
    },
    {
      user_id: player1Id,
      organizer_id: organizerId,
      game_id: gameIds[0],
      amount: 25000, // ₱250 game fee
      direction: "debit",
      source: "payment",
      note: "BGC Pickup 5v5 fee",
    },
    {
      user_id: player2Id,
      organizer_id: null,
      game_id: null,
      amount: 50000, // ₱500 topup
      direction: "credit",
      source: "payment",
      note: "Top-up via Maya",
    },
    {
      user_id: player2Id,
      organizer_id: organizerId,
      game_id: gameIds[0],
      amount: 25000,
      direction: "debit",
      source: "payment",
      note: "BGC Pickup 5v5 fee",
    },
  ];

  const { error: walletErr } = await service.from("wallet_transactions").insert(walletEntries);

  if (walletErr) {
    return NextResponse.json(
      { error: `Failed to seed wallet transactions: ${walletErr.message}` },
      { status: 500 }
    );
  }

  results.push("Seeded wallet transactions");

  return NextResponse.json({
    ok: true,
    results,
    credentials: {
      organizer: { email: "organizer@test.rondo", password: "Test1234!" },
      player1: { email: "player1@test.rondo", password: "Test1234!" },
      player2: { email: "player2@test.rondo", password: "Test1234!" },
    },
  });
}
