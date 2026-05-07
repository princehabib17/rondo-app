"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Trophy, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GameCard, GameCardSkeleton } from "@/components/game/GameCard";
import type { Game, Announcement } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/utils/format";

type PriceFilter = "all" | "free" | "under200" | "under500";
type DateFilter = "all" | "today" | "tomorrow" | "thisweek";

export default function FeedPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

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
        .limit(20),
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
    <div className="min-h-[100dvh]">
      {/* Header */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border-2 border-rondo-yellow flex items-center justify-center">
              <span className="text-rondo-yellow font-black text-xs tracking-widest">R</span>
            </div>
            <span className="text-white font-black text-lg tracking-[0.15em]">RONDO</span>
          </div>
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer" aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Filter chips */}
      <div className="border-b border-border bg-background px-4 py-3 space-y-2 max-w-lg mx-auto">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {(Object.keys(dateLabels) as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[32px] active:scale-[0.96] ${
                dateFilter === f
                  ? "bg-rondo-yellow text-rondo-black"
                  : "bg-secondary text-muted-foreground hover:text-white"
              }`}
            >
              {dateLabels[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {(Object.keys(priceLabels) as PriceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPriceFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[32px] active:scale-[0.96] ${
                priceFilter === f
                  ? "bg-rondo-yellow text-rondo-black"
                  : "bg-secondary text-muted-foreground hover:text-white"
              }`}
            >
              {priceLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-8 max-w-lg mx-auto">
        {/* Announcements */}
        {announcements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={14} className="text-rondo-yellow" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Announcements</h2>
            </div>
            <div className="space-y-2">
              {announcements.map((a, i) => (
                <div
                  key={a.id}
                  className="bg-card border border-border rounded-xl p-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-full bg-rondo-yellow/10 border border-rondo-yellow/20 flex items-center justify-center">
                      <span className="text-rondo-yellow text-xs font-bold">
                        {(a.organizer?.full_name ?? "O").slice(0, 1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white text-sm font-semibold">{a.organizer?.full_name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{formatRelativeTime(a.created_at)}</span>
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
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-rondo-yellow" />
              <h2 className="text-white font-bold text-lg">Join Local Games</h2>
            </div>
            {!loading && (
              <span className="text-muted-foreground text-xs">{filtered.length} available</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => <GameCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <Trophy size={24} className="text-muted-foreground" />
              </div>
              <p className="text-white font-semibold">No games found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
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
    </div>
  );
}
