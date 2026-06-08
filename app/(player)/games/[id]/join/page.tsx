"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Game } from "@/lib/supabase/types";

type TeamWithPlayers = {
  id: string;
  name: string;
  color: string;
  slot_number: number;
  game_players?: Array<{ id: string; profile: unknown }>;
};
import { cn } from "@/lib/utils";
import { pushInAppNotification } from "@/lib/notifications";
import {
  canPayLater,
  isTeamFull,
  requiresApproval,
  teamSpotsLeft,
  usesWallet,
} from "@/lib/match/rules";

export default function JoinMatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const waitlistOnly = searchParams.get("waitlist") === "1";
  const claimSpot = searchParams.get("claim") === "1";

  const [game, setGame] = useState<Game | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("games")
        .select(
          `*, teams(id, name, color, slot_number, game_players:game_players(id, profile:profiles(id, avatar_url, nationality)))`
        )
        .eq("id", id)
        .single();
      if (data) setGame(data as Game);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleLeaveWaitlist() {
    setLeaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/waitlist?gameId=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not leave waitlist");
      router.push(`/games/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Leave waitlist failed");
      setLeaving(false);
    }
  }

  async function handleClaimSpot() {
    if (!game) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/matches/waitlist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, teamId: selectedTeamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not claim spot");
      router.push(json.nextPath ?? `/games/${id}/confirmed`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Claim failed");
      setJoining(false);
    }
  }

  async function handleWaitlist() {
    if (!game) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/matches/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, teamId: selectedTeamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not join waitlist");
      router.push(`/games/${id}/confirmed`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Join waitlist failed");
      setJoining(false);
    }
  }

  async function handleConfirm() {
    if (!selectedTeamId || !game) return;

    setJoining(true);
    setError(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    if (isGuestUser(userData.user)) {
      router.push(`/signup?next=/games/${id}/join`);
      return;
    }

    // Wallet games redirect to payment page (payment page handles the insert)
    if (usesWallet(game)) {
      router.push(`/games/${id}/payment?teamId=${selectedTeamId}`);
      return;
    }

    // All non-wallet joins go through the server route which enforces capacity
    const paymentStatus = requiresApproval(game)
      ? "pending_approval"
      : canPayLater(game)
        ? "reserved"
        : "venue";

    const res = await fetch("/api/matches/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, teamId: selectedTeamId, paymentStatus }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not join. Please try again.");
      setJoining(false);
      return;
    }

    if (requiresApproval(game)) {
      await pushInAppNotification({
        userId: userData.user.id,
        type: "join_requested",
        title: "Request sent",
        body: `Your request to join ${game.title} is pending approval.`,
        link: `/games/${id}/confirmed`,
      });
    }

    router.push(`/games/${id}/confirmed`);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page p-4 space-y-4">
        <div className="h-8 w-32 rondo-shimmer rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-40 rondo-shimmer rounded-xl" />
          <div className="h-40 rondo-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!game) return null;

  const teams = ((game.teams ?? []) as TeamWithPlayers[]).sort(
    (a, b) => a.slot_number - b.slot_number
  );

  const primaryLabel = claimSpot
    ? "Claim spot"
    : waitlistOnly
      ? "Join waitlist"
      : requiresApproval(game)
        ? usesWallet(game) && !canPayLater(game)
          ? "Pay & request approval"
          : "Request to join"
        : usesWallet(game)
          ? "Pay to confirm"
          : canPayLater(game)
            ? "Reserve spot"
            : "Choose slot";

  const onPrimary = claimSpot ? handleClaimSpot : waitlistOnly ? handleWaitlist : handleConfirm;

  if (teams.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-white font-bold text-lg">No teams yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          The organizer hasn&apos;t set up teams for this game. Check back closer to kick-off.
        </p>
        <button
          onClick={() => router.back()}
          className="w-full max-w-xs border border-border text-white text-sm py-4 rounded-xl cursor-pointer min-h-[44px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-28">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-sm uppercase">
          {claimSpot ? "Claim spot" : waitlistOnly ? "Waitlist" : "Choose slot"}
        </h1>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <p className="font-body text-white/50 text-sm">
          {waitlistOnly
            ? "No order — when a spot opens, everyone on the waitlist gets notified. First to accept gets in."
            : claimSpot
              ? "A spot opened. Pick a team and claim it before someone else does."
              : "Pick your team. The organizer can move players later."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {teams.map((team) => {
            const players = team.game_players;
            const full = isTeamFull(team, game);
            const left = teamSpotsLeft(team, game);
            const isSelected = selectedTeamId === team.id;

            return (
              <button
                key={team.id}
                type="button"
                disabled={full && !waitlistOnly}
                onClick={() => setSelectedTeamId(team.id)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all min-h-[44px]",
                  full && !waitlistOnly && "opacity-45 cursor-not-allowed",
                  isSelected
                    ? "border-rondo-accent bg-rondo-accent/10"
                    : "border-white/12 bg-white/5 hover:border-white/25"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rondo-accent flex items-center justify-center">
                    <Check size={14} className="text-black" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                  <span className="text-white font-bold text-sm truncate">{team.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {players?.map((gp) =>
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
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Users size={11} />
                  <span>{full ? "Full" : `${left} spot${left === 1 ? "" : "s"} left`}</span>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 rondo-glass-nav z-30 space-y-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={!selectedTeamId || joining || leaving}
          className="rondo-btn rondo-btn-primary w-full disabled:opacity-40 min-h-[52px]"
        >
          {joining ? "Working…" : primaryLabel}
        </button>
        {(waitlistOnly || claimSpot) && (
          <button
            type="button"
            onClick={handleLeaveWaitlist}
            disabled={joining || leaving}
            className="w-full text-white/50 hover:text-white text-sm py-2 disabled:opacity-40"
          >
            {leaving ? "Leaving…" : "Leave waitlist"}
          </button>
        )}
      </div>
    </div>
  );
}
