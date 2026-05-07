"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Timer, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatGameDate } from "@/lib/utils/format";
import type { Game, Team, GamePlayer, Profile } from "@/lib/supabase/types";

interface ManagedGame extends Game {
  teams: (Team & { game_players: (GamePlayer & { profile: Profile | null })[] })[];
}

export default function ManageGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<ManagedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [unassigned, setUnassigned] = useState<(GamePlayer & { profile: Profile | null })[]>([]);

  async function loadGame() {
    const supabase = createClient();
    const { data } = await supabase
      .from("games")
      .select(`*, teams(id, name, color, slot_number, game_players(id, user_id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)))`)
      .eq("id", id)
      .single();

    if (data) {
      const gameData = data as unknown as ManagedGame;
      setGame(gameData);
      const { data: allGp } = await supabase
        .from("game_players")
        .select("id, user_id, team_id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)")
        .eq("game_id", id)
        .is("team_id", null);
      setUnassigned((allGp as unknown as (GamePlayer & { profile: Profile | null })[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadGame(); }, [id]);

  async function assignTeam(playerId: string, teamId: string) {
    const supabase = createClient();
    await supabase.from("game_players").update({ team_id: teamId }).eq("id", playerId);
    await loadGame();
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-4">
        {[0,1,2].map((i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!game) return <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">Game not found</div>;

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm truncate">{game.title}</h1>
          <p className="text-muted-foreground text-xs">{formatGameDate(game.date_time)}</p>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/organizer/games/${id}/announce`)}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <Megaphone size={18} className="text-rondo-yellow shrink-0" />
            <span className="text-white text-sm font-semibold">Announce</span>
          </button>
          <button
            onClick={() => router.push(`/organizer/games/${id}/timer`)}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <Timer size={18} className="text-rondo-yellow shrink-0" />
            <span className="text-white text-sm font-semibold">Timer</span>
          </button>
        </div>

        {/* Teams roster */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-rondo-yellow" />
            <h2 className="text-white font-bold text-base">Roster</h2>
          </div>

          {game.teams?.sort((a, b) => a.slot_number - b.slot_number).map((team) => (
            <div key={team.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                <span className="text-white font-bold text-sm">{team.name}</span>
                <span className="text-muted-foreground text-xs ml-auto">{team.game_players?.length ?? 0} players</span>
              </div>
              <div className="space-y-2">
                {(team.game_players ?? []).map((gp) => (
                  gp.profile && (
                    <div key={gp.id} className="flex items-center gap-3">
                      <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
                      <span className="text-white text-sm flex-1">{gp.profile.full_name}</span>
                      <span className={`text-xs font-semibold ${gp.payment_status === "paid" ? "text-green-400" : "text-muted-foreground"}`}>
                        {gp.payment_status === "paid" ? "Paid" : gp.payment_status === "venue" ? "At Venue" : "Pending"}
                      </span>
                    </div>
                  )
                ))}
                {(team.game_players?.length ?? 0) === 0 && (
                  <p className="text-muted-foreground text-xs">No players yet</p>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <span className="text-muted-foreground font-bold text-sm">Unassigned</span>
              {unassigned.map((gp) => (
                gp.profile && (
                  <div key={gp.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
                      <span className="text-white text-sm flex-1">{gp.profile.full_name}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap ml-12">
                      {game.teams?.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => assignTeam(gp.id, t.id)}
                          className="text-xs px-2 py-1 rounded border border-border hover:border-rondo-yellow text-muted-foreground hover:text-white transition-all cursor-pointer"
                        >
                          &rarr; {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
