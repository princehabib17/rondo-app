import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStandings } from "@/lib/tournament/bracket";

interface AwardRow {
  tournament_id: string;
  user_id: string;
  team_id: string | null;
  kind: "champion" | "runner_up" | "top_scorer";
  tournament_name: string;
  team_name: string | null;
  detail: string | null;
}

/**
 * Snapshots a finished tournament's honors onto profiles:
 * - champion + runner-up for every rostered member (captain included) of the
 *   two teams that decided the title,
 * - top scorer for the tagged player with the most goals (skipped when no
 *   goal was attributed to a registered account).
 *
 * Idempotent: the unique (tournament_id, user_id, kind) constraint makes
 * re-running a completion a no-op via upsert-ignore.
 */
export async function grantTournamentAwards(service: SupabaseClient, tournamentId: string) {
  const { data: tournament } = await service
    .from("tournaments")
    .select("id, name, format, status")
    .eq("id", tournamentId)
    .single();
  if (!tournament || tournament.status !== "completed") return;

  const [{ data: teams }, { data: matches }] = await Promise.all([
    service
      .from("tournament_teams")
      .select("id, name, captain_id, is_managed")
      .eq("tournament_id", tournamentId)
      .eq("status", "registered"),
    service
      .from("tournament_matches")
      .select("id, round, position, home_team_id, away_team_id, home_score, away_score, status")
      .eq("tournament_id", tournamentId),
  ]);
  if (!teams?.length || !matches?.length) return;

  let championTeamId: string | null = null;
  let runnerUpTeamId: string | null = null;
  let championDetail: string | null = null;
  let runnerUpDetail: string | null = null;

  if (tournament.format === "single_elimination") {
    const finalRound = Math.max(...matches.map((m) => m.round));
    const final = matches.find(
      (m) => m.round === finalRound && m.status === "completed" && m.home_score != null && m.away_score != null
    );
    if (!final) return;
    const homeWon = (final.home_score ?? 0) > (final.away_score ?? 0);
    championTeamId = homeWon ? final.home_team_id : final.away_team_id;
    runnerUpTeamId = homeWon ? final.away_team_id : final.home_team_id;
    championDetail = `Won the final ${final.home_score} - ${final.away_score}`;
    runnerUpDetail = `Lost the final ${final.home_score} - ${final.away_score}`;
  } else {
    const standings = computeStandings(
      teams.map((t) => t.id),
      matches
    );
    championTeamId = standings[0]?.teamId ?? null;
    runnerUpTeamId = standings[1]?.teamId ?? null;
    const top = standings[0];
    const second = standings[1];
    championDetail = top ? `Topped the table with ${top.points} pts` : null;
    runnerUpDetail = second ? `Finished second with ${second.points} pts` : null;
  }
  if (!championTeamId) return;

  const { data: members } = await service
    .from("tournament_team_members")
    .select("team_id, user_id")
    .eq("tournament_id", tournamentId)
    .in("team_id", [championTeamId, runnerUpTeamId].filter(Boolean) as string[]);

  // Rostered members plus captains (self-registered captains may not have a
  // roster row of their own; organizer-managed teams skip the captain).
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const awardees = new Map<string, { userId: string; teamId: string }>();
  for (const m of members ?? []) {
    awardees.set(`${m.team_id}:${m.user_id}`, { userId: m.user_id, teamId: m.team_id });
  }
  for (const teamId of [championTeamId, runnerUpTeamId]) {
    if (!teamId) continue;
    const team = teamById.get(teamId);
    if (team && !team.is_managed) {
      awardees.set(`${teamId}:${team.captain_id}`, { userId: team.captain_id, teamId });
    }
  }

  const rows: AwardRow[] = [];
  for (const { userId, teamId } of awardees.values()) {
    const isChampion = teamId === championTeamId;
    if (!isChampion && teamId !== runnerUpTeamId) continue;
    rows.push({
      tournament_id: tournamentId,
      user_id: userId,
      team_id: teamId,
      kind: isChampion ? "champion" : "runner_up",
      tournament_name: tournament.name,
      team_name: teamById.get(teamId)?.name ?? null,
      detail: isChampion ? championDetail : runnerUpDetail,
    });
  }

  // Top scorer: most goals among tagged players; first to reach the tally wins ties.
  const { data: goals } = await service
    .from("tournament_goals")
    .select("scorer_id, team_id, goals, created_at")
    .eq("tournament_id", tournamentId)
    .not("scorer_id", "is", null)
    .order("created_at", { ascending: true });

  if (goals?.length) {
    const tally = new Map<string, { total: number; teamId: string }>();
    let leader: { userId: string; total: number; teamId: string } | null = null;
    for (const g of goals) {
      const userId = g.scorer_id as string;
      const next = {
        total: (tally.get(userId)?.total ?? 0) + g.goals,
        teamId: g.team_id as string,
      };
      tally.set(userId, next);
      if (!leader || next.total > leader.total) {
        leader = { userId, total: next.total, teamId: next.teamId };
      }
    }
    if (leader) {
      rows.push({
        tournament_id: tournamentId,
        user_id: leader.userId,
        team_id: leader.teamId,
        kind: "top_scorer",
        tournament_name: tournament.name,
        team_name: teamById.get(leader.teamId)?.name ?? null,
        detail: `${leader.total} goal${leader.total === 1 ? "" : "s"}`,
      });
    }
  }

  if (rows.length === 0) return;

  await service
    .from("tournament_awards")
    .upsert(rows, { onConflict: "tournament_id,user_id,kind", ignoreDuplicates: true });

  await service.from("notifications").insert(
    rows.map((row) => ({
      user_id: row.user_id,
      type: "tournament_award",
      title:
        row.kind === "champion"
          ? "You're a champion!"
          : row.kind === "runner_up"
            ? "Runners-up medal"
            : "Top scorer!",
      body:
        row.kind === "top_scorer"
          ? `${row.tournament_name}: top scorer with ${row.detail}`
          : `${row.tournament_name}: ${row.kind === "champion" ? "champions" : "runners-up"} with ${row.team_name}`,
      link: `/tournaments/${tournamentId}`,
    }))
  );
}
