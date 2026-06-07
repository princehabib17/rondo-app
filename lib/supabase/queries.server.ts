import { createClient } from "./server";
import type { Game, Profile, GamePlayer } from "./types";
import { PUBLIC_PROFILE_SELECT } from "./profile-select";

export async function getGameById(gameId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(`
      *,
      organizer:profiles!organizer_id(${PUBLIC_PROFILE_SELECT}),
      teams(*),
      game_players(*, profile:profiles(${PUBLIC_PROFILE_SELECT}))
    `)
    .eq("id", gameId)
    .single();
  if (error) throw error;
  return data as Game;
}

export async function getOpenGames(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(`*, organizer:profiles!organizer_id(id, full_name, avatar_url), teams(id, name, color)`)
    .eq("status", "open")
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Game[];
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getMyGames(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_players")
    .select(`*, game:games(*, teams(*))`)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GamePlayer[];
}

export async function getOrganizerGames(organizerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(`*, teams(*), game_players(id)`)
    .eq("organizer_id", organizerId)
    .order("date_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Game[];
}
