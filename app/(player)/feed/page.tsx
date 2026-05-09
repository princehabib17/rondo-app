"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Bell, Trophy, Megaphone, List, Map } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GameCard, GameCardSkeleton } from "@/components/game/GameCard";
import type { Game, Announcement } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/utils/format";

// Leaflet must not run on the server
const GameMap = dynamic(() => import("@/components/map/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="w-2 h-2 rounded-full bg-rondo-yellow animate-ping" />
    </div>
  ),
});

type PriceFilter = "all" | "free" | "under200" | "under500";
type DateFilter = "all" | "today" | "tomorrow" | "thisweek";
type ViewMode = "list" | "map";

export default function FeedPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [view, setView] = useState<ViewMode>("list");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const [{ data: gamesData }, { data: announcementsData }] = await Promise.all([
      supabase
        .from("games")
        .select("*, organizer:profiles!organizer_id(id,full_name,avatar_url), teams(id,name,color), game_players(id)")
        .eq("status", "open")
        .gte("date_time", now)
        .order("date_time", { ascending: true })
        .limit(50),
      supabase
        .from("announcements")
        .select("*, organizer:profiles(id,full_name,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    setGames((gamesData as Game[]) ?? []);
    setAnnouncements((announcementsData as Announcement[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = games.filter((g) => {
    const d = new Date(g.date_time);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);

    if (dateFilter === "today" && d.toDateString() !== now.toDateString()) return false;
    if (dateFilter === "tomorrow" && d.toDateString() !== tomorrow.toDateString()) return false;
    if (dateFilter === "thisweek" && (d < now || d > weekEnd)) return false;

    if (priceFilter === "free" && g.price_per_player > 0) return false;
    if (priceFilter === "under200" && g.price_per_player > 20000) return false;
    if (priceFilter === "under500" && g.price_per_player > 50000) return false;

    return true;
  });

  const dateLabels: Record<DateFilter, string> = { all: "All Dates", today: "Today", tomorrow: "Tomorrow", thisweek: "This Week" };
  const priceLabels: Record<PriceFilter, string> = { all: "Any Price", free: "Free", under200: "Under ₱200", under500: "Under ₱500" };

  return (
    <div className={`flex flex-col ${view === "map" ? "h-[100dvh]" : "min-h-[100dvh]"}`}>
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg border-2 border-primary flex items-center justify-center bg-primary/5">
              <span className="text-primary font-black text-sm">R</span>
            </div>
            <span className="text-foreground font-black text-lg tracking-widest">RONDO</span>
          </div>

          <div className="flex items-center gap-2">
            {/* List / Map toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1 border-2 border-border">
              <button
                onClick={() => setView("list")}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer font-semibold ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView("map")}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer font-semibold ${
                  view === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Map view"
              >
                <Map size={18} />
              </button>
            </div>

            <button
              className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter chips — always visible */}
      <div className="border-b border-border bg-background px-4 py-3 space-y-2.5 shrink-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 max-w-lg mx-auto">
          {(Object.keys(dateLabels) as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                dateFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:border-primary border border-border"
              }`}
            >
              {dateLabels[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 max-w-lg mx-auto">
          {(Object.keys(priceLabels) as PriceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPriceFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                priceFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:border-primary border border-border"
              }`}
            >
              {priceLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* MAP VIEW */}
      {view === "map" && (
        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
              <div className="w-2 h-2 rounded-full bg-rondo-yellow animate-ping" />
            </div>
          ) : (
            <GameMap games={filtered} />
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="px-4 py-5 space-y-8 max-w-lg mx-auto w-full">
          {/* Announcements */}
          {announcements.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <Megaphone size={16} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Announcements</h2>
              </div>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-card border-2 border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-xs font-bold">
                          {(a.organizer?.full_name ?? "O").slice(0, 1)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-foreground text-sm font-semibold block">{a.organizer?.full_name}</span>
                        <span className="text-muted-foreground text-xs">{formatRelativeTime(a.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{a.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Games */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Trophy size={18} className="text-primary" />
                <h2 className="text-foreground font-black text-lg">Available Games</h2>
              </div>
              {!loading && (
                <span className="text-primary font-bold text-xs">{filtered.length}</span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => <GameCardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Trophy size={28} className="text-primary" />
                </div>
                <p className="text-foreground font-bold text-lg">No Games Found</p>
                <p className="text-muted-foreground text-sm max-w-xs">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((game, i) => (
                  <GameCard key={game.id} game={game} index={i} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
