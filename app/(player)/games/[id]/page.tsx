"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronRight, MapPin, Megaphone, Timer, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isGuestUser } from "@/lib/auth/is-guest";
import { MatchTeamsRoster } from "@/components/match/MatchTeamsRoster";
import { MatchRulesPanel } from "@/components/match/MatchRulesPanel";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import {
  getMatchStatusBanner,
  resolveJoinCta,
  spotsLeft,
} from "@/lib/match/rules";
import type { Game, GamePlayer } from "@/lib/supabase/types";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [gamesHosted, setGamesHosted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<GamePlayer | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [leavingWaitlist, setLeavingWaitlist] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
      setIsGuest(isGuestUser(userData.user));

      const { data } = await supabase
        .from("games")
        .select(
          `
          *,
          organizer:profiles!organizer_id(${PUBLIC_PROFILE_SELECT}),
          teams(id, name, color, slot_number,
            game_players:game_players(id, user_id, profile:profiles(id, avatar_url, nationality))
          ),
          game_players(id, user_id, team_id, payment_status)
        `
        )
        .eq("id", id)
        .single();

      if (data) {
        const g = data as Game;
        setGame(g);
        if (userData.user?.id) {
          const entry = (g.game_players as GamePlayer[]).find(
            (gp) => gp.user_id === userData.user!.id
          );
          setMyEntry(entry ?? null);

          const { data: wl } = await supabase
            .from("game_waitlist")
            .select("id")
            .eq("game_id", id)
            .eq("user_id", userData.user.id)
            .eq("status", "waiting")
            .maybeSingle();
          setOnWaitlist(Boolean(wl));
        }

        const { count } = await supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("organizer_id", g.organizer_id)
          .neq("status", "cancelled");
        setGamesHosted(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] rondo-page">
        <div className="h-52 rondo-shimmer" />
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <div className="h-6 w-2/3 rondo-shimmer rounded" />
          <div className="h-24 rondo-shimmer rounded-xl" />
          <div className="h-40 rondo-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-[100dvh] rondo-page flex items-center justify-center">
        <p className="text-white/50">Match not found</p>
      </div>
    );
  }

  const banner = getMatchStatusBanner(game);
  const cta = resolveJoinCta({
    game,
    myEntry,
    isGuest,
    hasUser: Boolean(currentUserId),
    onWaitlist,
  });
  const left = spotsLeft(game);
  const spotOpenForWaitlist = onWaitlist && !myEntry && left > 0;

  async function leaveWaitlist() {
    setLeavingWaitlist(true);
    try {
      const res = await fetch(`/api/matches/waitlist?gameId=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not leave waitlist");
      }
      setOnWaitlist(false);
    } catch {
      // silent — user can retry
    } finally {
      setLeavingWaitlist(false);
    }
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-36">
      <header className="sticky top-0 z-40 rondo-glass-nav border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/5 rounded-lg transition-colors active:scale-[0.95]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-base uppercase flex-1 truncate">
          {game.title}
        </h1>
        <span className="font-heading text-rondo-accent font-black text-sm shrink-0">
          {game.price_per_player === 0 ? "Free" : formatPrice(game.price_per_player)}
        </span>
      </header>

      <div className="relative h-48 bg-[#1c1c1c]">
        {game.banner_url ? (
          <img src={game.banner_url} alt="" className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-rondo-page via-rondo-page/40 to-transparent" />
        <span className="absolute bottom-3 left-4 font-heading text-white/90 text-2xl font-black italic uppercase">
          {game.format}
        </span>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {banner && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              banner.tone === "error"
                ? "bg-red-950/40 border-red-800/50 text-red-200"
                : "bg-amber-950/30 border-amber-700/40 text-amber-100"
            }`}
          >
            {banner.text}
          </div>
        )}

        <MatchRulesPanel game={game} organizer={game.organizer} gamesHosted={gamesHosted} />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-rondo-accent shrink-0" />
            <div>
              <p className="text-white/45 text-[10px] uppercase">When</p>
              <p className="text-white text-sm font-semibold">{formatGameDate(game.date_time)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-rondo-accent shrink-0" />
            <div>
              <p className="text-white/45 text-[10px] uppercase">Where</p>
              <p className="text-white text-sm font-semibold">{game.venue_name}</p>
              <p className="text-white/50 text-xs">{game.venue_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users size={16} className="text-rondo-accent shrink-0" />
            <div>
              <p className="text-white/45 text-[10px] uppercase">Spots</p>
              <p className="text-white text-sm font-semibold">
                {game.max_players - left} / {game.max_players} filled
                {left > 0 && (
                  <span className="text-rondo-accent ml-2">{left} left</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [game.venue_name, game.venue_address].filter(Boolean).join(", ")
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rondo-surface flex items-center gap-3 p-4 active:scale-[0.98] transition-transform"
        >
          <MapPin size={18} className="text-rondo-accent shrink-0" />
          <span className="text-white text-sm font-semibold flex-1">Open in Maps</span>
          <ChevronRight size={16} className="text-white/30" />
        </a>

        <MatchTeamsRoster game={game} />

        <Link
          href={`/games/${game.id}/timer`}
          className="rondo-surface flex items-center gap-4 p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rondo-accent text-rondo-black">
            <Timer size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold">Live match timer</p>
            <p className="text-white/45 text-xs">
              Open the round clock, current matchup, and next rotation.
            </p>
          </div>
          <ChevronRight size={18} className="text-white/30 shrink-0" />
        </Link>

        {myEntry && (
          <div className="rondo-surface border-rondo-accent/30 p-4 text-center">
            <p className="text-rondo-accent font-semibold text-sm">You have a spot in this match</p>
            <p className="text-white/50 text-xs mt-1 capitalize">{myEntry.payment_status.replace(/_/g, " ")}</p>
          </div>
        )}

        {onWaitlist && !myEntry && (
          <div className="rondo-surface border-amber-500/30 p-4 space-y-3">
            {spotOpenForWaitlist ? (
              <>
                <p className="text-amber-100 text-sm font-semibold">A spot is open — claim it before someone else does.</p>
                <p className="text-white/45 text-xs">Everyone on the waitlist was notified. First to accept wins.</p>
              </>
            ) : (
              <>
                <p className="text-white text-sm font-semibold">You&apos;re on the waitlist</p>
                <p className="text-white/45 text-xs">
                  When a spot opens, everyone gets notified. First to accept gets in. You stay on the list until you leave.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={leaveWaitlist}
              disabled={leavingWaitlist}
              className="text-white/60 hover:text-white text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
            >
              {leavingWaitlist ? "Leaving…" : "Leave waitlist"}
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2 z-30 flex gap-2">
        <Link
          href={`/games/${game.id}/room`}
          className="min-w-[72px] min-h-[52px] rondo-surface flex flex-col items-center justify-center gap-0.5 text-white hover:text-rondo-accent transition-colors"
          aria-label="Organizer room"
        >
          <Megaphone size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Room</span>
        </Link>

        {cta.action === "disabled" ? (
          <div className="flex-1 rondo-surface px-4 py-3 flex flex-col justify-center min-h-[52px]">
            <p className="text-white font-bold text-sm">{cta.label}</p>
            <p className="text-white/45 text-xs">{cta.reason}</p>
          </div>
        ) : cta.action === "login" || cta.action === "signup" ? (
          <Link href={cta.href!} className="flex-1 rondo-btn rondo-btn-primary min-h-[52px] flex items-center justify-center">
            {cta.label}
          </Link>
        ) : (
          <Link
            href={cta.href}
            className="flex-1 rondo-btn rondo-btn-primary min-h-[52px] flex items-center justify-center gap-2"
          >
            {cta.label}
            <ChevronRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}
