import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { insertTeamWithNumber } from "@/lib/tournament/teams";

const bodySchema = z.object({
  teamName: z.string().trim().min(2).max(60),
});

/**
 * Organizer adds a team manually — the worst-case path when captains aren't
 * on Rondo yet. The team is flagged is_managed so the organizer (its nominal
 * captain) doesn't collect its honors, and players can still join its roster
 * later.
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

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: tournament } = await service
      .from("tournaments")
      .select("id, organizer_id, status, max_teams")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Only the organizer can add teams" }, { status: 403 });
    }
    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Registration is closed" }, { status: 409 });
    }

    const { count } = await service
      .from("tournament_teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .eq("status", "registered");
    if ((count ?? 0) >= tournament.max_teams) {
      return NextResponse.json({ error: "This tournament is full" }, { status: 409 });
    }

    const { teamId, teamNumber, errorCode, errorMessage } = await insertTeamWithNumber(service, {
      tournamentId,
      captainId: userData.user.id,
      name: parsed.data.teamName,
      isManaged: true,
    });

    if (!teamId) {
      if (errorCode === "23505") {
        return NextResponse.json({ error: "That team name is taken" }, { status: 409 });
      }
      return NextResponse.json({ error: errorMessage ?? "Could not add team" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, teamId, teamNumber });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not add team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
