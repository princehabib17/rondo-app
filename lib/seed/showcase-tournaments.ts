import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateRoundRobin,
  generateSingleElimination,
  placeInSlot,
  type FixtureSlot,
} from "@/lib/tournament/bracket";
import type { OrganizerSeed } from "@/lib/seed/placeholder-organizers";

/**
 * Finished showcase competitions run by Rondo's own account, so a brand-new
 * city still shows what a bracket, a league table, and a champion look like.
 * They are completed on purpose: nobody can register for a showcase, and no
 * real organizer's name is attached to a result that never happened.
 */
export const SHOWCASE_ORGANIZER: OrganizerSeed = {
  slug: "rondo-showcase",
  email: "showcase@organizers.rondo",
  full_name: "Rondo Showcase",
  avatar_url: "/brand/rondo-mark-on-dark.png",
  bio: "Finished showcase competitions so you can see how Rondo runs a cup and a league. Real tournaments near you appear as organizers list them.",
  verified: true,
  preferred_areas: "Metro Manila",
  game_preference: "both",
  organizationName: "Rondo Showcase",
  schedules: [],
};

type ShowcaseTeam = { name: string; squad: string[] };

export interface ShowcaseTournament {
  name: string;
  description: string;
  format: "single_elimination" | "round_robin";
  venueName: string;
  venueAddress: string;
  /** Kickoff of matchday one, in days before the seed runs. */
  startedDaysAgo: number;
  /** Days between matchdays. */
  matchdayGap: number;
  teamSize: number;
  entryFeeCentavos: number;
  teams: ShowcaseTeam[];
  /** Scores in fixture order (round, then position), home first. Byes are skipped. */
  scores: Array<[number, number]>;
}

export const SHOWCASE_TOURNAMENTS: ShowcaseTournament[] = [
  {
    name: "Kalye Cup",
    description:
      "Showcase knockout. Eight 7-a-side teams, one night per round, winner takes the cup. This is how every Rondo bracket runs.",
    format: "single_elimination",
    venueName: "BGC Turf",
    venueAddress: "Bonifacio Global City, Taguig, Metro Manila",
    startedDaysAgo: 16,
    matchdayGap: 7,
    teamSize: 7,
    entryFeeCentavos: 350000,
    teams: [
      { name: "Kalye FC", squad: ["JP Alcantara", "Migs Yulo", "Rafa Del Rosario"] },
      { name: "Taguig Tigers", squad: ["Kobe Nazareno", "Paolo Bugia", "Enzo Manalo"] },
      { name: "Sunday Ballers", squad: ["Dante Ferrer", "Luis Tolentino", "Gabo Ramos"] },
      { name: "McKinley Strikers", squad: ["Ivan Soriano", "Chino Dizon", "Bryce Lim"] },
      { name: "Fort Rovers", squad: ["Marco Villaflor", "Nico Bautista", "Jules Ocampo"] },
      { name: "Pasig Pumas", squad: ["Carlo Santos", "Renz Aquino", "Tom Galvez"] },
      { name: "Makati Melees", squad: ["Andre Uy", "Sef Garcia", "Iggy Reyes"] },
      { name: "Bridgetown United", squad: ["Lance Co", "Jomar Pineda", "Kiko Valdez"] },
    ],
    // QF x4, SF x2, Final
    scores: [
      [3, 1],
      [2, 4],
      [5, 2],
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
    ],
  },
  {
    name: "Metro Futsal League",
    description:
      "Showcase league. Five futsal sides, everyone plays everyone once, three points a win. Standings and the golden boot update after every result.",
    format: "round_robin",
    venueName: "Axis Residences Tower B",
    venueAddress: "Axis Residences Tower B, Mandaluyong, Metro Manila",
    startedDaysAgo: 40,
    matchdayGap: 7,
    teamSize: 5,
    entryFeeCentavos: 250000,
    teams: [
      { name: "Axis Futsal", squad: ["Pao Mercado", "Jerome Tan", "Benj Cruz"] },
      { name: "Cherry Five", squad: ["Aldo Navarro", "Miko Sison", "Raffy Dela Paz"] },
      { name: "Shaw Boulevard SC", squad: ["Gino Pascual", "Zach Belmonte", "Owen Lacson"] },
      { name: "Ortigas Owls", squad: ["Patrick Yap", "Vince Coronel", "Josh Abad"] },
      { name: "Wack Wack Wanderers", squad: ["Ely Fernando", "Dom Castro", "Ryan Mendoza"] },
    ],
    // 5 teams: 5 matchdays, two fixtures each (one side rests).
    scores: [
      [4, 2],
      [3, 3],
      [2, 5],
      [1, 1],
      [6, 3],
      [2, 0],
      [3, 4],
      [2, 2],
      [5, 1],
      [0, 2],
    ],
  },
];

/** Splits a side's goals across its squad so a believable top scorer emerges. */
export function distributeGoals(goals: number, squad: string[], matchIndex: number): Array<{ name: string; goals: number }> {
  if (goals <= 0 || squad.length === 0) return [];
  const tally = new Map<string, number>();
  for (let g = 0; g < goals; g++) {
    // The first name is the team's finisher: they take every other goal.
    const pick = g % 2 === 0 ? squad[0] : squad[1 + ((g + matchIndex) % (squad.length - 1 || 1))] ?? squad[0];
    tally.set(pick, (tally.get(pick) ?? 0) + 1);
  }
  return [...tally.entries()].map(([name, count]) => ({ name, goals: count }));
}

type PlayedFixture = FixtureSlot & { homeScore: number | null; awayScore: number | null; status: "completed" | "bye" };

/** Plays the fixture list through with the scripted scores, advancing knockout winners. */
export function playShowcaseFixtures(seed: ShowcaseTournament, teamIds: string[]): PlayedFixture[] {
  const fixtures =
    seed.format === "single_elimination" ? generateSingleElimination(teamIds) : generateRoundRobin(teamIds);
  fixtures.sort((a, b) => a.round - b.round || a.position - b.position);

  const played: PlayedFixture[] = [];
  let scoreIndex = 0;
  for (const fixture of fixtures) {
    if (fixture.isBye) {
      played.push({ ...fixture, homeScore: null, awayScore: null, status: "bye" });
      continue;
    }
    const [homeScore, awayScore] = seed.scores[scoreIndex++] ?? [1, 0];
    played.push({ ...fixture, homeScore, awayScore, status: "completed" });

    if (seed.format === "single_elimination" && fixture.homeTeamId && fixture.awayTeamId) {
      const winner = homeScore >= awayScore ? fixture.homeTeamId : fixture.awayTeamId;
      const next = fixtures.find((f) => f.round === fixture.round + 1 && f.position === Math.floor(fixture.position / 2));
      if (next) placeInSlot(next, fixture.position, winner);
    }
  }
  return played;
}

/** Manila kickoffs (UTC+8, no DST) at 7 PM, 8 PM, ... whatever the server's timezone. */
function kickoffFor(seed: ShowcaseTournament, round: number, position: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - seed.startedDaysAgo + (round - 1) * seed.matchdayGap);
  d.setUTCHours(19 - 8 + position, 0, 0, 0);
  return d.toISOString();
}

/** Inserts any showcase competition the organizer does not have yet. Returns how many were created. */
export async function ensureShowcaseTournaments(service: SupabaseClient, organizerId: string): Promise<number> {
  const { data: existing } = await service
    .from("tournaments")
    .select("name")
    .eq("organizer_id", organizerId);
  const have = new Set((existing ?? []).map((row: { name: string }) => row.name));

  let created = 0;
  for (const seed of SHOWCASE_TOURNAMENTS) {
    if (have.has(seed.name)) continue;

    const { data: tournament, error: tournamentError } = await service
      .from("tournaments")
      .insert({
        organizer_id: organizerId,
        name: seed.name,
        description: seed.description,
        format: seed.format,
        status: "completed",
        venue_name: seed.venueName,
        venue_address: seed.venueAddress,
        starts_at: kickoffFor(seed, 1, 0),
        max_teams: seed.teams.length,
        team_size: seed.teamSize,
        entry_fee: seed.entryFeeCentavos,
      })
      .select("id")
      .single();
    if (tournamentError || !tournament) {
      throw new Error(`Failed to create ${seed.name}: ${tournamentError?.message ?? "unknown error"}`);
    }

    const { data: teams, error: teamsError } = await service
      .from("tournament_teams")
      .insert(
        seed.teams.map((team, i) => ({
          tournament_id: tournament.id,
          captain_id: organizerId,
          name: team.name,
          team_number: i + 1,
          seed: i + 1,
          is_managed: true,
          status: "registered",
        }))
      )
      .select("id, name");
    if (teamsError || !teams) {
      throw new Error(`Failed to create teams for ${seed.name}: ${teamsError?.message ?? "unknown error"}`);
    }

    const idByName = new Map(teams.map((team: { id: string; name: string }) => [team.name, team.id]));
    const teamIds = seed.teams.map((team) => idByName.get(team.name)!);
    const squadById = new Map(seed.teams.map((team) => [idByName.get(team.name)!, team.squad]));
    const played = playShowcaseFixtures(seed, teamIds);

    const { data: matches, error: matchesError } = await service
      .from("tournament_matches")
      .insert(
        played.map((fixture) => ({
          tournament_id: tournament.id,
          round: fixture.round,
          position: fixture.position,
          home_team_id: fixture.homeTeamId,
          away_team_id: fixture.awayTeamId,
          home_score: fixture.homeScore,
          away_score: fixture.awayScore,
          status: fixture.status,
          scheduled_at: kickoffFor(seed, fixture.round, fixture.position),
        }))
      )
      .select("id, round, position");
    if (matchesError || !matches) {
      throw new Error(`Failed to create fixtures for ${seed.name}: ${matchesError?.message ?? "unknown error"}`);
    }

    const matchId = new Map(
      matches.map((m: { id: string; round: number; position: number }) => [`${m.round}:${m.position}`, m.id])
    );
    const goals = played.flatMap((fixture, index) => {
      if (fixture.status !== "completed") return [];
      const id = matchId.get(`${fixture.round}:${fixture.position}`);
      if (!id) return [];
      const sides: Array<[string | null, number | null]> = [
        [fixture.homeTeamId, fixture.homeScore],
        [fixture.awayTeamId, fixture.awayScore],
      ];
      return sides.flatMap(([teamId, score]) =>
        teamId && score
          ? distributeGoals(score, squadById.get(teamId) ?? [], index).map((scorer) => ({
              tournament_id: tournament.id,
              match_id: id,
              team_id: teamId,
              scorer_name: scorer.name,
              goals: scorer.goals,
            }))
          : []
      );
    });
    if (goals.length > 0) {
      const { error: goalsError } = await service.from("tournament_goals").insert(goals);
      if (goalsError) {
        throw new Error(`Failed to log goals for ${seed.name}: ${goalsError.message}`);
      }
    }
    created++;
  }
  return created;
}
