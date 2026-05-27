"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Shield, ChevronRight, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game, GamePlayer, Profile, Team } from "@/lib/supabase/types";

interface TeamWithPlayers extends Team {
  game_players: Array<{ id: string; user_id: string; profile: Profile | null }>;
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<GamePlayer | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
      setIsGuest(Boolean(userData.user?.is_anonymous));

      const { data } = await supabase
        .from("games")
        .select(`
          *,
          organizer:profiles!organizer_id(*),
          teams(id, name, color, slot_number,
            game_players:game_players(id, user_id, profile:profiles(id, full_name, avatar_url, nationality))
          ),
          game_players(id, user_id, team_id)
        `)
        .eq("id", id)
        .single();

      if (data) {
        setGame(data as Game);
        if (userData.user?.id) {
          const entry = (data.game_players as GamePlayer[]).find(
            (gp) => gp.user_id === userData.user!.id
          );
          setMyEntry(entry ?? null);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] space-y-0">
        <div className="h-52 bg-muted animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-6 bg-muted rounded animate-pulse w-2/3" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    );
  }

  const totalPlayers = game.game_players?.length ?? 0;
  const spotsLeft = game.max_players - totalPlayers;

  return (
    <div className="min-h-[100dvh] pb-32">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer active:scale-[0.95]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-foreground font-black text-base flex-1 truncate">{game.title}</h1>
        <span className="text-primary font-black text-base">{formatPrice(game.price_per_player)}</span>
      </header>

      {/* Banner */}
      <div className="relative h-56 bg-muted">
        {game.banner_url ? (
          <img src={game.banner_url} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-b border-border">
            <Shield size={48} className="text-green-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Tags/Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-semibold">{game.format}</Badge>
          <Badge variant="secondary" className="font-semibold">{game.round_duration_minutes}m rounds</Badge>
          {game.payment_type === "online"
            ? <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold">Pay Online</Badge>
            : <Badge variant="secondary" className="font-semibold">Pay at Venue</Badge>}
          {spotsLeft <= 0 && <Badge variant="destructive" className="font-semibold">Full</Badge>}
        </div>

        {/* Game Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">DATE & TIME</p>
              <span className="text-foreground text-sm font-semibold">{formatGameDate(game.date_time)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">VENUE</p>
              <span className="text-foreground text-sm font-semibold">{game.venue_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">PLAYERS</p>
              <span className="text-foreground text-sm font-semibold">
                {totalPlayers} / {game.max_players}
                {spotsLeft > 0 && <span className="text-primary font-bold ml-2">({spotsLeft} left)</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Organizer */}
        {game.organizer && (
          <div className="flex items-center gap-3 py-4 px-3 border border-border rounded-xl bg-card hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 overflow-hidden flex items-center justify-center shrink-0">
              {game.organizer.avatar_url ? (
                <img src={game.organizer.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-xs font-bold">
                  {(game.organizer.full_name ?? "O").slice(0, 1)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Organized by</p>
              <p className="text-foreground text-sm font-bold truncate">{game.organizer.full_name}</p>
            </div>
          </div>
        )}

        {/* Open in Maps */}
        {(game.venue_address || game.venue_name) && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [game.venue_name, game.venue_address].filter(Boolean).join(", ")
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full border-2 border-border rounded-xl px-4 py-3 hover:border-primary/60 bg-card active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-foreground text-sm font-bold truncate">{game.venue_name}</p>
              <p className="text-muted-foreground text-xs truncate">{game.venue_address}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </a>
        )}

        {/* Teams */}
        {game.teams && game.teams.length > 0 && (
          <section>
            <h2 className="text-foreground font-black text-lg mb-4">Choose Your Team</h2>
            <div className="grid grid-cols-2 gap-3">
              {(game.teams as TeamWithPlayers[])
                .sort((a, b) => a.slot_number - b.slot_number)
                .map((team) => {
                  const teamPlayers = team.game_players;
                  return (
                    <div key={team.id} className="bg-card border-2 border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 border-2 border-white"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-foreground font-black text-sm flex-1">{team.name}</span>
                        <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded-lg">
                          {teamPlayers?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {teamPlayers?.map((gp) =>
                          gp.profile ? (
                            <PlayerAvatar
                              key={gp.id}
                              profile={gp.profile}
                              size="xs"
                              showFlag
                              linkable
                            />
                          ) : null
                        )}
                        {(teamPlayers?.length ?? 0) === 0 && (
                          <p className="text-muted-foreground text-xs">No players yet</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Already joined */}
        {myEntry && (
          <div className="bg-green-950/40 border border-green-800/50 rounded-xl p-4 text-center">
            <p className="text-green-300 font-semibold">You&apos;re in this game</p>
            <p className="text-muted-foreground text-sm mt-1">See you on the pitch!</p>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2 z-30 flex gap-3">
        {!currentUserId ? (
          <Link
            href={`/login?next=/games/${game.id}`}
            className="flex-1 bg-rondo-accent text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
          >
            Login to Join
          </Link>
        ) : isGuest ? (
          <Link
            href={`/signup?next=/games/${game.id}`}
            className="flex-1 bg-rondo-accent text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
          >
            Create Account to Join
          </Link>
        ) : myEntry ? (
          <Link
            href={`/games/${game.id}/chat`}
            className="flex-1 bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
          >
            <MessageCircle size={18} />
            Squad Chat
          </Link>
        ) : (
          <>
            <Link
              href={`/games/${game.id}/chat`}
              className="min-w-[52px] min-h-[52px] bg-zinc-800 border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-zinc-700 active:scale-[0.96] transition-all cursor-pointer"
              aria-label="Open chat"
            >
              <MessageCircle size={18} />
            </Link>
            <button
              onClick={() => router.push(`/games/${game.id}/join`)}
              disabled={spotsLeft <= 0}
              className="flex-1 bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[52px]"
            >
              {spotsLeft <= 0 ? "Game Full" : "Join Game"}
              {spotsLeft > 0 && <ChevronRight size={18} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
