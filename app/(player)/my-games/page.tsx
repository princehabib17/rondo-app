"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Calendar, MapPin, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface MyGame {
  id: string;
  game_id: string;
  payment_status: string;
  joined_at: string;
  game: {
    id: string;
    title: string;
    venue_name: string;
    date_time: string;
    price_per_player: number;
    status: string;
    format: string;
  };
}

export default function MyMatchesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<MyGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("game_players")
        .select("id, game_id, payment_status, joined_at, game:games(id, title, venue_name, date_time, price_per_player, status, format)")
        .eq("user_id", userData.user.id)
        .order("joined_at", { ascending: false });
      setEntries((data as unknown as MyGame[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const now = new Date();
  const upcoming = entries.filter((e) => new Date(e.game.date_time) >= now);
  const past = entries.filter((e) => new Date(e.game.date_time) < now);
  const pendingApproval = entries.filter((e) => e.payment_status === "pending_approval");
  const reservedUnpaid = entries.filter((e) =>
    ["reserved", "pending_payment", "pending", "venue"].includes(e.payment_status)
  );
  const completed = past.filter((e) =>
    ["paid", "approved", "venue"].includes(e.payment_status) && e.game.status === "completed"
  );
  const cancelled = entries.filter((e) =>
    e.game.status === "cancelled" || ["cancelled", "rejected", "refunded"].includes(e.payment_status)
  );

  const paymentColor: Record<string, string> = {
    paid: "text-green-400",
    venue: "text-yellow-400",
    pending: "text-muted-foreground",
    pending_payment: "text-blue-300",
    reserved: "text-rondo-yellow",
    pending_approval: "text-blue-300",
    approved: "text-green-400",
    rejected: "text-destructive",
    cancelled: "text-destructive",
    no_show: "text-destructive",
    refunded: "text-destructive",
  };

  function MatchRow({ entry }: { entry: MyGame }) {
    const needsWalletPay = ["reserved", "pending_payment", "pending"].includes(entry.payment_status);
    const href = needsWalletPay
      ? `/games/${entry.game.id}/payment`
      : `/games/${entry.game.id}`;

    return (
      <Link href={href} className="block cursor-pointer">
        <div className="rondo-surface p-4 hover:border-rondo-accent/30 active:scale-[0.98] transition-[transform,border-color] duration-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-white font-bold text-sm leading-tight flex-1">{entry.game.title}</h3>
            <span className="text-rondo-yellow font-black text-sm whitespace-nowrap">{formatPrice(entry.game.price_per_player)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar size={11} />
              <span>{formatGameDate(entry.game.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MapPin size={11} />
              <span>{entry.game.venue_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs h-5">{entry.game.format}</Badge>
            <span className={`text-xs font-semibold capitalize ${paymentColor[entry.payment_status] ?? "text-muted-foreground"}`}>
              {entry.payment_status === "venue"
                ? "Pay at Venue"
                : needsWalletPay
                  ? "Pay with wallet"
                  : entry.payment_status}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <Bookmark size={18} className="text-rondo-yellow" />
          <h1 className="text-white font-black text-lg">My Matches</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-8 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map((i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Bookmark size={24} className="text-muted-foreground" />
            </div>
            <p className="text-white font-semibold">No matches yet</p>
            <p className="text-muted-foreground text-sm">Join a match from the feed to see it here</p>
            <Link href="/feed" className="text-rondo-yellow text-sm font-semibold hover:underline mt-2">Browse Matches</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-rondo-yellow" />
                  <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
                </div>
                {upcoming.map((e) => <MatchRow key={e.id} entry={e} />)}
              </section>
            )}
            {pendingApproval.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Pending Approval ({pendingApproval.length})</h2>
                {pendingApproval.map((e) => <MatchRow key={`pending-${e.id}`} entry={e} />)}
              </section>
            )}
            {reservedUnpaid.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Reserved / Unpaid ({reservedUnpaid.length})</h2>
                {reservedUnpaid.map((e) => <MatchRow key={`reserved-${e.id}`} entry={e} />)}
              </section>
            )}
            {completed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Completed ({completed.length})</h2>
                {completed.map((e) => <MatchRow key={`completed-${e.id}`} entry={e} />)}
              </section>
            )}
            {cancelled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Cancelled ({cancelled.length})</h2>
                {cancelled.map((e) => <MatchRow key={`cancelled-${e.id}`} entry={e} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Past ({past.length})</h2>
                {past.map((e) => <MatchRow key={e.id} entry={e} />)}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
