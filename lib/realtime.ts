import { createClient } from "@/lib/supabase/client";
import type { TimerSession, Message } from "@/lib/supabase/types";

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
