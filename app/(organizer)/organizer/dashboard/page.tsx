"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  ImagePlus,
  Plus,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";

interface OrgGame {
  id: string;
  title: string;
  date_time: string;
  price_per_player: number;
  max_players: number;
  status: string;
  format: string;
  banner_url: string | null;
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

const statusColor: Record<string, string> = {
  open: "text-emerald-300 bg-emerald-400/10",
  full: "text-rondo-yellow bg-rondo-yellow/10",
  in_progress: "text-sky-300 bg-sky-400/10",
  completed: "text-white/45 bg-white/8",
  cancelled: "text-red-300 bg-red-400/10",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-rondo-yellow";

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
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

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
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setOrganizerId(userData.user.id);
      const [{ data }] = await Promise.all([
        supabase
          .from("games")
          .select("id, title, date_time, price_per_player, max_players, status, format, banner_url, game_players(id, payment_status)")
          .eq("organizer_id", userData.user.id)
          .order("date_time", { ascending: false }),
        loadPayoutHistory(),
      ]);
      setGames((data as unknown as OrgGame[]) ?? []);
      setNowMs(Date.now());
      setLoading(false);
    }
    load();
  }, [router]);

  const totalPlayers = games.reduce((sum, g) => sum + g.game_players.length, 0);
  const totalEarnings = games.reduce((sum, g) => {
    const paid = g.game_players.filter((p) => p.payment_status === "paid").length;
    return sum + paid * g.price_per_player;
  }, 0);
  const nextGame = games
    .filter((g) => new Date(g.date_time).getTime() >= nowMs)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0];

  async function submitPayoutRequest() {
    if (!organizerId) return;
    const amount = Math.round(Number(payoutAmount) * 100);
    if (!amount || amount <= 0) return;
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

  async function uploadCover(gameId: string, file: File) {
    if (!organizerId || uploadingCoverId) return;
    setUploadingCoverId(gameId);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${organizerId}/${gameId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("game-covers")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        toast.error(`Cover upload failed: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("game-covers").getPublicUrl(path);
      const bannerUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from("games")
        .update({ banner_url: bannerUrl })
        .eq("id", gameId);
      if (updateError) {
        toast.error(`Could not save cover: ${updateError.message}`);
        return;
      }
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, banner_url: bannerUrl } : g))
      );
      toast.success("Cover updated");
    } finally {
      setUploadingCoverId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-8">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rondo-yellow">
              Organizer
            </p>
            <h1 className="font-heading text-xl font-black uppercase italic text-white">
              Command Center
            </h1>
          </div>
          <Link
            href="/organizer/create"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rondo-yellow px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition active:scale-[0.98]"
          >
            <Plus size={16} />
            Create
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="relative min-h-[220px] p-5 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(233,255,58,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_48%)]" />
            <div className="relative grid gap-5 md:grid-cols-[1.25fr_0.75fr] md:items-end">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-rondo-yellow/25 bg-rondo-yellow/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rondo-yellow">
                  Live operations
                </div>
                <div className="space-y-2">
                  <h2 className="max-w-xl font-heading text-4xl font-black uppercase italic leading-none text-white sm:text-5xl">
                    Build games people trust instantly.
                  </h2>
                  <p className="max-w-md text-sm leading-6 text-white/55">
                    Create polished match pages, run tournaments as a separate product path, and keep payouts visible without burying game operations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/organizer/create" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rondo-yellow px-4 py-3 text-xs font-black uppercase tracking-wider text-black">
                    <ClipboardList size={15} />
                    Create match
                  </Link>
                  <Link href="/organizer/tournaments/create" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-xs font-black uppercase tracking-wider text-white">
                    <Trophy size={15} />
                    Build tournament
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
                <MetricCard label="Games" value={loading ? "--" : String(games.length)} />
                <MetricCard label="Players" value={loading ? "--" : String(totalPlayers)} />
                <MetricCard label="Earned" value={loading ? "--" : formatPrice(totalEarnings)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <ActionCard
            href="/organizer/create"
            icon={<ClipboardList size={18} />}
            title="Match creation"
            description="Cover, venue, teams, price, and rules in one guided flow."
          />
          <ActionCard
            href="/organizer/tournaments"
            icon={<Trophy size={18} />}
            title="Tournaments"
            description="Create cups and manage brackets outside the match form."
          />
          <ActionCard
            href="/organizer/organizations"
            icon={<Building2 size={18} />}
            title="Organizations"
            description="Manage brands, admins, and approval ownership."
          />
        </section>

        {nextGame && (
          <section className="rounded-2xl border border-rondo-yellow/20 bg-rondo-yellow/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rondo-yellow text-black">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rondo-yellow">
                    Next live asset
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-black uppercase italic text-white">
                    {nextGame.title}
                  </h2>
                  <p className="text-sm text-white/55">{formatGameDate(nextGame.date_time)}</p>
                </div>
              </div>
              <Link
                href={`/organizer/games/${nextGame.id}/manage`}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-black/35 px-3 text-xs font-black uppercase tracking-wider text-white"
              >
                Manage
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Event inventory
                </p>
                <h2 className="font-heading text-2xl font-black uppercase italic text-white">
                  Your games
                </h2>
              </div>
              <Link href="/organizer/create" className="text-xs font-black uppercase tracking-wider text-rondo-yellow">
                New game
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl border border-white/8 bg-white/[0.035]" />
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.025] px-5 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
                  <ClipboardList size={24} className="text-white/45" />
                </div>
                <p className="font-heading text-lg font-black uppercase italic text-white">
                  No games created yet
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-white/45">
                  Start with a match page that has a cover image, venue, teams, and payment rules.
                </p>
                <Link href="/organizer/create" className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-rondo-yellow px-5 text-xs font-black uppercase tracking-wider text-black">
                  Create first game
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {games.map((game) => {
                  const capacity = Math.min(100, Math.round((game.game_players.length / Math.max(game.max_players, 1)) * 100));
                  return (
                    <article key={game.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-rondo-yellow/35">
                      <div className="relative h-36 bg-white/[0.04]">
                        {game.banner_url ? (
                          <img src={game.banner_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(233,255,58,0.12),transparent_34%),#0b0b0b]">
                            <ImagePlus size={24} className="text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <label
                          className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ImagePlus size={11} />
                          {uploadingCoverId === game.id ? "Uploading..." : game.banner_url ? "Change" : "Cover"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCoverId !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadCover(game.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                          <h3 className="line-clamp-2 font-heading text-lg font-black uppercase italic leading-none text-white">
                            {game.title}
                          </h3>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusColor[game.status] ?? "bg-white/8 text-white/45"}`}>
                            {game.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 p-4">
                        <p className="text-xs text-white/45">{formatGameDate(game.date_time)}</p>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1.5 text-white/55">
                              <Users size={12} />
                              {game.game_players.length}/{game.max_players}
                            </span>
                            <span className="font-black text-rondo-yellow">{formatPrice(game.price_per_player)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-rondo-yellow" style={{ width: `${capacity}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="h-6 text-xs">{game.format}</Badge>
                          <Link href={`/organizer/games/${game.id}/manage`} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white/8 px-3 text-[10px] font-black uppercase tracking-wider text-white">
                            Manage
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-rondo-yellow">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    Wallet ops
                  </p>
                  <h2 className="font-heading text-lg font-black uppercase italic text-white">
                    Request payout
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                <input value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount in PHP, e.g. 500" type="number" min="1" className={inputClass} />
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className={inputClass} />
                <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account name" className={inputClass} />
                <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account number" className={inputClass} />
                <button onClick={submitPayoutRequest} className="min-h-[48px] w-full rounded-xl bg-rondo-yellow text-xs font-black uppercase tracking-wider text-black">
                  Submit payout
                </button>
                {payoutMessage && <p className="text-xs text-white/70">{payoutMessage}</p>}
              </div>
            </div>

            {payoutHistory.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Recent requests
                </h3>
                <div className="space-y-2">
                  {payoutHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/25 p-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-black text-white">{formatPrice(entry.amount)}</p>
                        <p className="truncate text-white/40">
                          {entry.bank_name ?? "No bank"} - {formatGameDate(entry.created_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${payoutStatusStyle[entry.status]}`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-1 truncate font-heading text-xl font-black uppercase italic text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-rondo-yellow/35">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-rondo-yellow">
        {icon}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-black uppercase italic text-white">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-white/45">{description}</p>
        </div>
        <ChevronRight size={16} className="mt-1 text-white/30 transition group-hover:text-rondo-yellow" />
      </div>
    </Link>
  );
}
