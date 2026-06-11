import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import {
  generateRoundRobin,
  generateSingleElimination,
} from "@/lib/tournament/bracket";

/**
 * Closes registration and generates the full fixture list:
 * - single_elimination: seeded bracket (registration order), byes pre-advanced
 * - round_robin: circle-method matchdays
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: tournament } = await service
      .from("tournaments")
      .select("id, organizer_id, status, format, name")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Only the organizer can start this tournament" }, { status: 403 });
    }
    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Tournament has already started" }, { status: 409 });
    }

    const { data: teams } = await service
      .from("tournament_teams")
      .select("id, captain_id, name")
      .eq("tournament_id", tournamentId)
      .eq("status", "registered")
      .order("created_at", { ascending: true });

    if (!teams || teams.length < 2) {
      return NextResponse.json({ error: "Need at least 2 registered teams" }, { status: 409 });
    }

    const teamIds = teams.map((t) => t.id);
    const fixtures =
      tournament.format === "single_elimination"
        ? generateSingleElimination(teamIds)
        : generateRoundRobin(teamIds);

    // Seeds follow registration order.
    await Promise.all(
      teams.map((team, i) =>
        service.from("tournament_teams").update({ seed: i + 1 }).eq("id", team.id)
      )
    );

    const { error: insertError } = await service.from("tournament_matches").insert(
      fixtures.map((f) => ({
        tournament_id: tournamentId,
        round: f.round,
        position: f.position,
        home_team_id: f.homeTeamId,
        away_team_id: f.awayTeamId,
        status: f.isBye ? "bye" : "scheduled",
      }))
    );

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Fixtures were already generated" }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await service
      .from("tournaments")
      .update({ status: "active" })
      .eq("id", tournamentId);

    await service.from("notifications").insert(
      teams.map((team) => ({
        user_id: team.captain_id,
        type: "tournament_started",
        title: "Tournament started",
        body: `${tournament.name} is underway — check your fixtures`,
        link: `/tournaments/${tournamentId}`,
      }))
    );

    return NextResponse.json({ ok: true, matchCount: fixtures.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Start failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
