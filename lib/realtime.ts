import { createClient } from "@/lib/supabase/client";
import type { TimerSession, Message } from "@/lib/supabase/types";

/**
 * Fires on any change to a tournament's matches or its own row (status,
 * scores, bracket advancement). Callers refetch; payloads are not trusted
 * as full row state since bracket updates touch several rows at once.
 */
export function subscribeToTournament(tournamentId: string, onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel(`tournament:${tournamentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_matches",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournaments",
        filter: `id=eq.${tournamentId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_teams",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_team_members",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_goals",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToTimer(
  gameId: string,
  onUpdate: (session: TimerSession) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`timer:${gameId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "timer_sessions", filter: `game_id=eq.${gameId}` },
      (payload) => {
        if (payload.new) onUpdate(payload.new as TimerSession);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToMessages(
  gameId: string,
  onMessage: (msg: Message) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`chat:${gameId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `game_id=eq.${gameId}` },
      (payload) => {
        if (payload.new) onMessage(payload.new as Message);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
