"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Game, Team } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { pushInAppNotification } from "@/lib/notifications";

export default function JoinGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("games")
        .select(`*, teams(id, name, color, slot_number, game_players:game_players(id, profile:profiles(id, full_name, avatar_url, nationality)))`)
        .eq("id", id)
        .single();
      if (data) setGame(data as Game);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleConfirm() {
    if (!selectedTeamId || !game) return;
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    if (userData.user.is_anonymous) {
      router.push(`/signup?next=/games/${id}/join`);
      return;
    }

    if (game.payment_type === "online") {
      router.push(`/games/${id}/payment?teamId=${selectedTeamId}`);
      return;
    }

    // Pay at venue — join immediately; upsert prevents duplicate rows on double-tap
    const { error: joinError } = await supabase.from("game_players").upsert(
      {
        game_id: id,
        user_id: userData.user.id,
        team_id: selectedTeamId,
        payment_status: "venue",
      },
      { onConflict: "game_id,user_id" }
    );

    if (joinError) {
      setError(joinError.message);
      setJoining(false);
      return;
    }
    await pushInAppNotification({
      userId: userData.user.id,
      type: "join_confirmed",
      title: "Match joined",
      body: `You joined ${game.title}.`,
      link: `/games/${id}`,
    });
    router.push(`/games/${id}/invite`);
  }

  async function handleReserveNow() {
    if (!selectedTeamId || !game) return;
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    if (userData.user.is_anonymous) {
      router.push(`/signup?next=/games/${id}/join`);
      return;
    }

    const { error: reserveError } = await supabase.from("game_players").upsert(
      {
        game_id: id,
        user_id: userData.user.id,
        team_id: selectedTeamId,
        payment_status: "reserved",
      },
      { onConflict: "game_id,user_id" }
    );

    if (reserveError) {
      setError(reserveError.message);
      setJoining(false);
      return;
    }
    await pushInAppNotification({
      userId: userData.user.id,
      type: "join_reserved",
      title: "Spot reserved",
      body: `Your slot is reserved for ${game.title}.`,
      link: `/games/${id}/confirmed`,
    });
    router.push(`/games/${id}/confirmed`);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-4">
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!game) return null;

  const teams = (game.teams ?? []).sort((a: Team, b: Team) => a.slot_number - b.slot_number);

  return (
    <div className="min-h-[100dvh] pb-28">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base">Choose Your Team</h1>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <p className="text-muted-foreground text-sm">
          Pick a team to join. The organizer may adjust assignments before the game starts.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {teams.map((team: Team) => {
            const players = (team as Team & { game_players?: Array<{ id: string; profile: unknown }> }).game_players;
            const isSelected = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer active:scale-[0.97] min-h-[44px]",
                  isSelected
                    ? "border-rondo-yellow bg-rondo-yellow/5"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rondo-yellow flex items-center justify-center">
                    <Check size={14} className="text-rondo-black" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-white font-bold text-sm">{team.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {players?.slice(0, 6).map((gp) =>
                    gp.profile ? (
                      <PlayerAvatar
                        key={gp.id}
                        profile={gp.profile as Parameters<typeof PlayerAvatar>[0]["profile"]}
                        size="xs"
                        showFlag
                        linkable={false}
                      />
                    ) : null
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Users size={11} />
                  <span>{players?.length ?? 0} players</span>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-background border-t border-border z-30">
        <button
          onClick={handleConfirm}
          disabled={!selectedTeamId || joining}
          className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[52px]"
        >
          {joining
            ? "Confirming..."
            : game.payment_type === "online"
            ? "Continue to Payment"
            : "Confirm Team"}
        </button>
        {game.payment_type === "online" && (
          <button
            onClick={handleReserveNow}
            disabled={!selectedTeamId || joining}
            className="w-full mt-3 border border-border text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[52px]"
          >
            Reserve & Pay Later
          </button>
        )}
      </div>
    </div>
  );
}
