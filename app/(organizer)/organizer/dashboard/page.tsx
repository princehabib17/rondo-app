"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, Trophy, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

interface PayoutHistoryEntry {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  bank_name: string | null;
  created_at: string;
}

const payoutStatusStyle: Record<PayoutHistoryEntry["status"], string> = {
  pending: "bg-amber-400/15 text-amber-300",
  approved: "bg-sky-400/15 text-sky-300",
  paid: "bg-emerald-400/15 text-emerald-300",
  rejected: "bg-red-400/15 text-red-300",
};

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<OrgGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryEntry[]>([]);

  async function loadPayoutHistory() {
    const res = await fetch("/api/wallet/payout");
    if (!res.ok) return;
    const json = await res.json();
    setPayoutHistory(json.requests ?? []);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      setOrganizerId(userData.user.id);
      const [{ data }] = await Promise.all([
        supabase
          .from("games")
          .select("id, title, date_time, price_per_player, max_players, status, format, game_players(id, payment_status)")
          .eq("organizer_id", userData.user.id)
          .order("date_time", { ascending: false }),
        loadPayoutHistory(),
      ]);
      setGames((data as unknown as OrgGame[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const totalEarnings = games.reduce((sum, g) => {
    const paid = g.game_players.filter((p) => p.payment_status === "paid").length;
    return sum + paid * g.price_per_player;
  }, 0);

  async function submitPayoutRequest() {
    if (!organizerId) return;
    const amount = Math.round(Number(payoutAmount) * 100); // convert ₱ → centavos
    if (!amount || amount <= 0) return;
    // Goes through the API so balance validation and pending-request
    // dedup apply (a direct insert would skip both).
    const res = await fetch("/api/wallet/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCentavos: amount,
        bankName,
        bankAccountName,
        bankAccountNumber,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setPayoutMessage(json.error ?? "Could not submit payout request");
      return;
    }
    setPayoutAmount("");
    setPayoutMessage("Payout request submitted.");
    await loadPayoutHistory();
  }

  const statusColor: Record<string, string> = {
    open: "text-green-400",
    full: "text-rondo-yellow",
    in_progress: "text-blue-400",
    completed: "text-muted-foreground",
    cancelled: "text-destructive",
  };

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={18} className="text-rondo-yellow" />
            <h1 className="text-white font-black text-lg">My Games</h1>
          </div>
          <Link
            href="/organizer/create"
            className="flex items-center gap-1.5 bg-rondo-yellow text-rondo-black font-black text-xs uppercase tracking-wider px-3 py-2 rounded-lg active:scale-[0.97] transition-all cursor-pointer min-h-[36px]"
          >
            <Plus size={14} /> Create
          </Link>
        </div>
      </header>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        <Link
          href="/organizer/tournaments"
          className="flex items-center justify-between bg-card border border-border hover:border-rondo-accent/40 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Trophy size={18} className="text-rondo-yellow" />
            <div>
              <p className="text-white font-bold text-sm">Tournaments</p>
              <p className="text-muted-foreground text-xs">Run knockout cups and leagues</p>
            </div>
          </div>
          <span className="text-rondo-yellow text-xs font-black uppercase tracking-wider">Manage</span>
        </Link>

        {/* Earnings summary */}
        {!loading && games.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-rondo-yellow font-black text-xl">{games.length}</p>
              <p className="text-muted-foreground text-xs">Games</p>
            </div>
            <div>
              <p className="text-rondo-yellow font-black text-xl">
                {games.reduce((sum, g) => sum + g.game_players.length, 0)}
              </p>
              <p className="text-muted-foreground text-xs">Players</p>
            </div>
            <div>
              <p className="text-rondo-yellow font-black text-lg">{formatPrice(totalEarnings)}</p>
              <p className="text-muted-foreground text-xs">Earned</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Request Payout</h2>
            <input value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount in ₱ (e.g. 500)" type="number" min="1" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
            <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account name" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
            <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={submitPayoutRequest} className="w-full bg-rondo-yellow text-rondo-black font-black text-xs uppercase tracking-wider py-3 rounded-lg">
              Submit Payout Request
            </button>
            {payoutMessage && <p className="text-xs text-white/70">{payoutMessage}</p>}
            {payoutHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Recent requests
                </h3>
                {payoutHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold">{formatPrice(entry.amount)}</span>
                    <span className="text-muted-foreground truncate flex-1">
                      {entry.bank_name ?? "—"} · {formatGameDate(entry.created_at)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0 ${payoutStatusStyle[entry.status]}`}
                    >
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map((i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <ClipboardList size={24} className="text-muted-foreground" />
            </div>
            <p className="text-white font-semibold">No games created yet</p>
            <Link href="/organizer/create" className="bg-rondo-yellow text-rondo-black font-black text-sm uppercase tracking-wider px-6 py-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer">
              Create Your First Game
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Link key={game.id} href={`/organizer/games/${game.id}/manage`} className="block cursor-pointer">
                <div className="bg-card border border-border rounded-xl p-4 hover:border-rondo-yellow/40 active:scale-[0.98] transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-white font-bold text-sm leading-tight flex-1">{game.title}</h3>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">{formatGameDate(game.date_time)}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users size={12} className="text-muted-foreground" />
                      <span className="text-white">{game.game_players.length}/{game.max_players}</span>
                    </div>
                    <span className="text-rondo-yellow font-bold text-xs">{formatPrice(game.price_per_player)}</span>
                    <Badge variant="secondary" className="text-xs h-5">{game.format}</Badge>
                    <span className={`text-xs font-semibold capitalize ${statusColor[game.status] ?? "text-muted-foreground"}`}>{game.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
