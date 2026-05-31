"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Timer, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatGameDate } from "@/lib/utils/format";
import type { Game, Team, GamePlayer, Profile, GameWaitlistEntry } from "@/lib/supabase/types";

interface ManagedGame extends Game {
  teams: (Team & { game_players: (GamePlayer & { profile: Profile | null })[] })[];
}

type WaitlistRow = GameWaitlistEntry & { profile: Profile | null };

export default function ManageGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<ManagedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [unassigned, setUnassigned] = useState<(GamePlayer & { profile: Profile | null })[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [addingWaitlistId, setAddingWaitlistId] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
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

      const { data: wlRows } = await supabase
        .from("game_waitlist")
        .select("id, game_id, user_id, team_id, status, created_at, profile:profiles(id, full_name, avatar_url, nationality)")
        .eq("game_id", id)
        .eq("status", "waiting")
        .order("created_at", { ascending: true });
      setWaitlist((wlRows as unknown as WaitlistRow[]) ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadGame(); }, [loadGame]);

  async function assignTeam(playerId: string, teamId: string) {
    const supabase = createClient();
    await supabase.from("game_players").update({ team_id: teamId }).eq("id", playerId);
    await loadGame();
  }

  async function removePlayer(playerId: string) {
    const supabase = createClient();
    await supabase.from("game_players").delete().eq("id", playerId);
    if (game) {
      await fetch("/api/matches/waitlist/notify-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });
    }
    await loadGame();
  }

  async function approvePlayer(playerId: string) {
    const res = await fetch(`/api/organizer/games/${id}/approve-player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Failed to approve player");
      return;
    }
    await loadGame();
  }

  async function updatePlayerStatus(playerId: string, paymentStatus: string) {
    const supabase = createClient();
    await supabase.from("game_players").update({ payment_status: paymentStatus }).eq("id", playerId);
    await loadGame();
  }

  async function updateGameStatus(status: "cancelled" | "open") {
    const supabase = createClient();
    await supabase.from("games").update({ status }).eq("id", id);
    await loadGame();
  }

  async function toggleRegistration() {
    const supabase = createClient();
    await supabase
      .from("games")
      .update({ registration_open: !game?.registration_open })
      .eq("id", id);
    await loadGame();
  }

  async function togglePayRule() {
    const supabase = createClient();
    await supabase
      .from("games")
      .update({ allow_pay_later: !game?.allow_pay_later })
      .eq("id", id);
    await loadGame();
  }

  async function addFromWaitlist(waitlistId: string, teamId?: string | null) {
    setAddingWaitlistId(waitlistId);
    const res = await fetch(`/api/organizer/games/${id}/waitlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitlistId, teamId: teamId ?? null }),
    });
    setAddingWaitlistId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Could not add player");
      return;
    }
    await loadGame();
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-4">
        {[0,1,2].map((i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!game) return <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">Match not found</div>;

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
          <button
            onClick={() => router.push(`/organizer/games/${id}/payments`)}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <Users size={18} className="text-rondo-yellow shrink-0" />
            <span className="text-white text-sm font-semibold">Payments</span>
          </button>
          <button
            onClick={() => updateGameStatus(game.status === "cancelled" ? "open" : "cancelled")}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <span className="text-white text-sm font-semibold">
              {game.status === "cancelled" ? "Reopen Match" : "Cancel Match"}
            </span>
          </button>
          <button
            onClick={togglePayRule}
            className="col-span-2 bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <span className="text-white text-sm font-semibold">
              {game.allow_pay_later ? "Require pay to reserve" : "Allow reserve & pay later"}
            </span>
          </button>
          <button
            onClick={toggleRegistration}
            className="col-span-2 bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-rondo-yellow/40 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
          >
            <span className="text-white text-sm font-semibold">
              {game.registration_open === false ? "Open Registration" : "Close Registration"}
            </span>
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
                      {gp.payment_status === "pending_approval" && (
                        <button
                          type="button"
                          onClick={() => approvePlayer(gp.id)}
                          className="text-xs text-rondo-accent font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      <select
                        value={gp.payment_status}
                        onChange={(e) => updatePlayerStatus(gp.id, e.target.value)}
                        className="bg-black border border-white/10 text-white text-xs rounded px-2 py-1"
                      >
                        <option value="pending_approval">Pending approval</option>
                        <option value="pending_payment">Pending payment</option>
                        <option value="paid">Paid</option>
                        <option value="reserved">Reserved</option>
                        <option value="venue">At Venue</option>
                        <option value="no_show">No Show</option>
                        <option value="refund_requested">Refund Requested</option>
                      </select>
                      <button
                        onClick={() => removePlayer(gp.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
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

        {waitlist.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-rondo-yellow" />
              <h2 className="text-white font-bold text-base">Waitlist ({waitlist.length})</h2>
            </div>
            <p className="text-muted-foreground text-xs">
              No order — notify all when a spot opens, or add someone manually below.
            </p>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {waitlist.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {row.profile ? (
                      <PlayerAvatar profile={row.profile} size="sm" showFlag linkable={false} />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {row.profile?.full_name ?? "Player"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Joined {new Date(row.created_at).toLocaleDateString()}
                        {row.team_id
                          ? ` · prefers ${game.teams?.find((t) => t.id === row.team_id)?.name ?? "team"}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={addingWaitlistId === row.id}
                      onClick={() => addFromWaitlist(row.id, row.team_id)}
                      className="text-xs text-rondo-accent font-semibold disabled:opacity-50 shrink-0"
                    >
                      {addingWaitlistId === row.id ? "Adding…" : "Add to roster"}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap ml-12">
                    {game.teams?.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={addingWaitlistId === row.id}
                        onClick={() => addFromWaitlist(row.id, t.id)}
                        className="text-xs px-2 py-1 rounded border border-border hover:border-rondo-yellow text-muted-foreground hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        Add → {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
