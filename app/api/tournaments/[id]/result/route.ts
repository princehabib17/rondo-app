import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { placeInSlot } from "@/lib/tournament/bracket";

const bodySchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

/**
 * Records a match result. For single elimination the winner advances into
 * the next round's slot, and completing the final completes the tournament.
 * For round robin the tournament completes when every match is done.
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
    const { matchId, homeScore, awayScore } = parsed.data;

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
      return NextResponse.json({ error: "Only the organizer can record results" }, { status: 403 });
    }
    if (tournament.status !== "active") {
      return NextResponse.json({ error: "Tournament is not active" }, { status: 409 });
    }

    const { data: match } = await service
      .from("tournament_matches")
      .select("id, round, position, home_team_id, away_team_id, status")
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!match.home_team_id || !match.away_team_id) {
      return NextResponse.json({ error: "Both teams must be decided first" }, { status: 409 });
    }

    const isElimination = tournament.format === "single_elimination";
    if (isElimination && match.status === "completed") {
      return NextResponse.json(
        { error: "Result already recorded — knockout results can't be changed" },
        { status: 409 }
      );
    }
    if (isElimination && homeScore === awayScore) {
      return NextResponse.json({ error: "Knockout matches can't end in a draw" }, { status: 400 });
    }

    const { error: updateError } = await service
      .from("tournament_matches")
      .update({ home_score: homeScore, away_score: awayScore, status: "completed" })
      .eq("id", match.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let tournamentCompleted = false;

    if (isElimination) {
      const winnerId = homeScore > awayScore ? match.home_team_id : match.away_team_id;
      // The final is simply the bracket's last round — cheaper and more robust
      // than re-deriving it from the team count.
      const { data: lastMatch } = await service
        .from("tournament_matches")
        .select("round")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: false })
        .limit(1)
        .single();
      const finalRound = lastMatch?.round ?? 1;

      if (match.round >= finalRound) {
        tournamentCompleted = true;
      } else {
        const slot = { homeTeamId: null as string | null, awayTeamId: null as string | null };
        placeInSlot(slot, match.position, winnerId);
        const advance =
          slot.homeTeamId !== null
            ? { home_team_id: slot.homeTeamId }
            : { away_team_id: slot.awayTeamId };
        await service
          .from("tournament_matches")
          .update(advance)
          .eq("tournament_id", tournamentId)
          .eq("round", match.round + 1)
          .eq("position", Math.floor(match.position / 2));
      }
    } else {
      const { count: remaining } = await service
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .eq("status", "scheduled");
      tournamentCompleted = (remaining ?? 0) === 0;
    }

    if (tournamentCompleted) {
      await service.from("tournaments").update({ status: "completed" }).eq("id", tournamentId);
    }

    // Tell both captains the score went up (fire-and-forget).
    const captureHome = match.home_team_id;
    const captureAway = match.away_team_id;
    const tournamentName = tournament.name;
    after(async () => {
      const { data: matchTeams } = await service
        .from("tournament_teams")
        .select("id, captain_id, name")
        .in("id", [captureHome, captureAway]);

      if (matchTeams && matchTeams.length === 2) {
        const home = matchTeams.find((t) => t.id === captureHome);
        const away = matchTeams.find((t) => t.id === captureAway);
        if (home && away) {
          await service.from("notifications").insert(
            matchTeams.map((team) => ({
              user_id: team.captain_id,
              type: "tournament_result",
              title: "Result posted",
              body: `${home.name} ${homeScore} - ${awayScore} ${away.name} (${tournamentName})`,
              link: `/tournaments/${tournamentId}`,
            }))
          );
        }
      }
    });

    return NextResponse.json({ ok: true, tournamentCompleted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Recording result failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
