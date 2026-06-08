"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Wallet, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import Link from "next/link";

interface OrgGame {
  id: string;
  title: string;
  date_time: string;
  price_per_player: number;
  max_players: number;
  status: string;
  format: string;
  game_players: { id: string; payment_status: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  open: "text-green-400 bg-green-400/10",
  full: "text-rondo-accent bg-rondo-accent/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  completed: "text-white/30 bg-white/5",
  cancelled: "text-red-400 bg-red-400/10",
};

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<OrgGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("games")
        .select("id, title, date_time, price_per_player, max_players, status, format, game_players(id, payment_status)")
        .eq("organizer_id", userData.user.id)
        .order("date_time", { ascending: false });
      setGames((data as unknown as OrgGame[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const stats = useMemo(() => {
    const totalPlayers = games.reduce((s, g) => s + g.game_players.length, 0);
    const earned = games.reduce((sum, g) => {
      const paid = g.game_players.filter((p) => p.payment_status === "paid").length;
      return sum + paid * g.price_per_player;
    }, 0);
    return { totalPlayers, earned };
  }, [games]);

  const upcoming = games.filter((g) => g.status === "open" || g.status === "full");
  const past = games.filter((g) => g.status === "completed" || g.status === "cancelled" || g.status === "in_progress");

  return (
    <div className="min-h-[100dvh] bg-black pb-24">
      <header className="sticky top-0 z-40 bg-black border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="font-heading text-white font-black italic text-xl uppercase">My Games</h1>
          <Link
            href="/organizer/create"
            className="flex items-center gap-1.5 bg-rondo-accent text-black font-black text-xs uppercase tracking-widest px-3 py-2 rounded-xl active:scale-[0.97] transition-transform"
          >
            <Plus size={14} /> New Game
          </Link>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Stats */}
        {!loading && games.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-3 text-center">
              <p className="font-heading text-rondo-accent font-black text-2xl">{games.length}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Games</p>
            </div>
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Users size={12} className="text-white/40" />
                <p className="font-heading text-white font-black text-2xl">{stats.totalPlayers}</p>
              </div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Players</p>
            </div>
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp size={12} className="text-white/40" />
                <p className="font-heading text-rondo-accent font-black text-lg">{formatPrice(stats.earned)}</p>
              </div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Earned</p>
            </div>
          </div>
        )}

        {/* Wallet CTA */}
        {!loading && stats.earned > 0 && (
          <Link
            href="/wallet"
            className="flex items-center gap-3 bg-rondo-accent/8 border border-rondo-accent/20 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <Wallet size={16} className="text-rondo-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Cash out your earnings</p>
              <p className="text-white/40 text-xs">Request a bank transfer from your wallet</p>
            </div>
            <ChevronRight size={14} className="text-white/30 shrink-0" />
          </Link>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-[#141414] border border-white/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <p className="font-heading text-white font-black italic text-2xl uppercase">No games yet</p>
            <p className="text-white/40 text-sm max-w-[200px]">Create your first game and start filling your roster.</p>
            <Link
              href="/organizer/create"
              className="bg-rondo-accent text-black font-black text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              Create a Game
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {upcoming.length > 0 && (
              <section>
                <p className="font-heading text-white/40 text-xs uppercase tracking-widest mb-3">Upcoming</p>
                <div className="space-y-2">
                  {upcoming.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <p className="font-heading text-white/40 text-xs uppercase tracking-widest mb-3">Past</p>
                <div className="space-y-2">
                  {past.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: OrgGame }) {
  const paid = game.game_players.filter((p) => p.payment_status === "paid").length;
  const statusStyle = STATUS_STYLES[game.status] ?? "text-white/40 bg-white/5";

  return (
    <Link href={`/organizer/games/${game.id}/manage`} className="block">
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 active:scale-[0.98] transition-all active:border-rondo-accent/30">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="text-white font-bold text-sm leading-tight flex-1">{game.title}</h3>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${statusStyle}`}>
            {game.status}
          </span>
        </div>
        <p className="text-white/40 text-xs mb-3">{formatGameDate(game.date_time)}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-white/30" />
            <span className="text-white/60 text-xs">{game.game_players.length}/{game.max_players}</span>
          </div>
          {game.price_per_player > 0 && (
            <span className="text-rondo-accent text-xs font-bold">{formatPrice(game.price_per_player)}</span>
          )}
          <span className="text-white/30 text-xs">{game.format}</span>
          {paid > 0 && (
            <span className="text-green-400 text-xs ml-auto">{paid} paid</span>
          )}
        </div>
      </div>
    </Link>
  );
}
