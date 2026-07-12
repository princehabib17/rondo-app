import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

/**
 * A registered player adds themself to a team's roster. Rosters stay open
 * while the tournament is running (subs join late all the time); they lock
 * when it completes so honors snapshot a real squad.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id: tournamentId, teamId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to join a team" }, { status: 403 });
    }
    const userId = userData.user.id;

    const service = createServiceClient();
    const [{ data: tournament }, { data: team }] = await Promise.all([
      service
        .from("tournaments")
        .select("id, name, status, team_size")
        .eq("id", tournamentId)
        .single(),
      service
        .from("tournament_teams")
        .select("id, tournament_id, name, status, captain_id, is_managed, team_number")
        .eq("id", teamId)
        .single(),
    ]);

    if (!tournament || !team || team.tournament_id !== tournamentId) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (!["registration", "active"].includes(tournament.status)) {
      return NextResponse.json({ error: "This tournament has ended" }, { status: 409 });
    }
    if (team.status !== "registered") {
      return NextResponse.json({ error: "This team has withdrawn" }, { status: 409 });
    }

    // Starters plus a bench: rosters cap at double the players per side.
    const rosterCap = Math.max(tournament.team_size * 2, tournament.team_size + 3);
    const { count } = await service
      .from("tournament_team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);
    if ((count ?? 0) >= rosterCap) {
      return NextResponse.json({ error: "This roster is full" }, { status: 409 });
    }

    const { error: insertError } = await service.from("tournament_team_members").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      user_id: userId,
      role: "player",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You're already on a team in this tournament" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Real captains hear about new joiners; managed teams belong to the organizer.
    if (!team.is_managed) {
      await service.from("notifications").insert({
        user_id: team.captain_id,
        type: "tournament_roster_join",
        title: "New player on your team",
        body: `Someone joined ${team.name} (${tournament.name})`,
        link: `/tournaments/${tournamentId}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not join team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Leave the roster (or captain removing themself is blocked — they own the team). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id: tournamentId, teamId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = userData.user.id;

    const service = createServiceClient();
    const { data: membership } = await service
      .from("tournament_team_members")
      .select("id, role")
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "You're not on this roster" }, { status: 404 });
    }
    if (membership.role === "captain") {
      return NextResponse.json(
        { error: "Captains can't leave their own team" },
        { status: 409 }
      );
    }

    const { data: tournament } = await service
      .from("tournaments")
      .select("status")
      .eq("id", tournamentId)
      .single();
    if (tournament && !["registration", "active"].includes(tournament.status)) {
      return NextResponse.json({ error: "This tournament has ended" }, { status: 409 });
    }

    await service.from("tournament_team_members").delete().eq("id", membership.id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not leave team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
