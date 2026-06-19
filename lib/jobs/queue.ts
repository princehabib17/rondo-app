import { createServiceClient } from "@/lib/supabase/service";
import {
  generateRoundRobin,
  generateSingleElimination,
} from "@/lib/tournament/bracket";

// ---------- Job type discriminated union ----------

export interface TournamentStartJob {
  type: "tournament.start";
  payload: { tournamentId: string };
}

export type BackgroundJob = TournamentStartJob;
export type JobType = BackgroundJob["type"];

// ---------- Enqueue ----------

export async function enqueueJob(
  type: JobType,
  payload: BackgroundJob["payload"],
  options: { maxAttempts?: number; runAfter?: Date } = {}
): Promise<string> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("background_jobs")
    .insert({
      type,
      payload,
      max_attempts: options.maxAttempts ?? 3,
      run_after: (options.runAfter ?? new Date()).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to enqueue job: ${error.message}`);
  return data.id;
}

// ---------- Processor ----------

export async function processJob(job: {
  id: string;
  type: string;
  payload: unknown;
}): Promise<void> {
  if (job.type === "tournament.start") {
    await processTournamentStart(
      (job.payload as { tournamentId: string }).tournamentId
    );
    return;
  }
  throw new Error(`Unknown job type: ${job.type}`);
}

async function processTournamentStart(tournamentId: string): Promise<void> {
  const service = createServiceClient();

  const { data: tournament } = await service
    .from("tournaments")
    .select("id, organizer_id, status, format, name")
    .eq("id", tournamentId)
    .single();

  // Already completed on a previous attempt — idempotent exit.
  if (!tournament || tournament.status === "active") return;
  if (tournament.status !== "generating") {
    throw new Error(`Tournament ${tournamentId} is in unexpected status: ${tournament.status}`);
  }

  const { data: teams } = await service
    .from("tournament_teams")
    .select("id, captain_id, name")
    .eq("tournament_id", tournamentId)
    .eq("status", "registered")
    .order("created_at", { ascending: true });

  if (!teams || teams.length < 2) {
    throw new Error("Need at least 2 registered teams");
  }

  const teamIds = teams.map((t) => t.id);
  const fixtures =
    tournament.format === "single_elimination"
      ? generateSingleElimination(teamIds)
      : generateRoundRobin(teamIds);

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

  // Unique constraint violation → fixtures already inserted (prior attempt succeeded
  // for this step but failed before updating status). Continue to status update.
  if (insertError && insertError.code !== "23505") {
    throw new Error(`Fixture insert failed: ${insertError.message}`);
  }

  await service
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);

  // Notifications are best-effort; don't let a failure here roll back the bracket.
  await service.from("notifications").insert(
    teams.map((team) => ({
      user_id: team.captain_id,
      type: "tournament_started",
      title: "Tournament started",
      body: `${tournament.name} is underway — check your fixtures`,
      link: `/tournaments/${tournamentId}`,
    }))
  ).catch(() => null);
}
