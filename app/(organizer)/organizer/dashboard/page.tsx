"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ImagePlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import { bouncy } from "@/components/motion/springs";

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

const statusColor: Record<string, string> = {
  open: "text-emerald-300 bg-emerald-400/10",
  full: "text-rondo-yellow bg-rondo-yellow/10",
  in_progress: "text-sky-300 bg-sky-400/10",
  completed: "text-white/45 bg-white/8",
  cancelled: "text-red-300 bg-red-400/10",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning,";
  if (h >= 12 && h < 18) return "Good afternoon,";
  return "Good evening,";
}

// Deterministic gradient per game id for no-image fallback
const gradients = [
  "from-emerald-900/80 to-[var(--bg-page)]",
  "from-sky-900/80 to-[var(--bg-page)]",
  "from-violet-900/80 to-[var(--bg-page)]",
  "from-amber-900/80 to-[var(--bg-page)]",
  "from-rose-900/80 to-[var(--bg-page)]",
];
function gameGradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return gradients[n % gradients.length];
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<OrgGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setOrganizerId(userData.user.id);

      const [{ data: games }, { data: profile }] = await Promise.all([
        supabase
          .from("games")
          .select(
            "id, title, date_time, price_per_player, max_players, status, format, banner_url, game_players(id, payment_status)"
          )
          .eq("organizer_id", userData.user.id)
          .order("date_time", { ascending: false }),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userData.user.id)
          .single(),
      ]);

      setGames((games as unknown as OrgGame[]) ?? []);
      const name = profile?.full_name ?? "";
      setFirstName(name.split(" ")[0] ?? "");
      setNowMs(Date.now());
      setLoading(false);
    }
    load();
  }, [router]);

  const totalEarnings = games.reduce((sum, g) => {
    const paid = g.game_players.filter((p) => p.payment_status === "paid").length;
    return sum + paid * g.price_per_player;
  }, 0);

  const nextGame = games
    .filter((g) => new Date(g.date_time).getTime() >= nowMs)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0];

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
      const { error: updateError } = await supabase
        .from("games")
        .update({ banner_url: urlData.publicUrl })
        .eq("id", gameId);
      if (updateError) {
        toast.error(`Could not save cover: ${updateError.message}`);
        return;
      }
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, banner_url: urlData.publicUrl } : g))
      );
      toast.success("Cover updated");
    } finally {
      setUploadingCoverId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      {/* Sticky minimal header */}
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-[10px] font-black uppercase tracking-[0.26em] text-[var(--gold)]">
            Organizer
          </p>
          <Link
            href="/organizer/create/match"
            className="rondo-btn rondo-btn-primary !w-auto !min-h-[36px] px-4 text-[11px]"
          >
            + Create
          </Link>
        </div>
      </header>

      <div className="space-y-8 px-5 pb-12 pt-8">
        {/* Personal greeting — this IS the visual anchor */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={bouncy}
        >
          <p className="font-body text-sm text-[var(--ink-low)]">{getGreeting()}</p>
          <h1 className="font-heading text-[3.25rem] font-black uppercase italic leading-none text-[var(--ink-hi)]">
            {loading ? "..." : firstName || "Organizer"}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-4xl font-black italic text-[var(--gold)]">
              {loading ? "—" : formatPrice(totalEarnings)}
            </span>
            <span className="font-body text-sm text-[var(--ink-low)]">
              {loading ? "" : `earned · ${games.length} game${games.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </motion.section>

        {/* Quick actions — horizontal scroll pills, no icons */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...bouncy, delay: 0.06 }}
          className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-2">
            <Link
              href="/organizer/create/match"
              className="rondo-btn rondo-btn-primary !w-auto !min-h-10 px-5 text-xs"
            >
              Create Match
            </Link>
            <Link
              href="/organizer/tournaments"
              className="inline-flex h-10 items-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] px-5 font-body text-xs font-black uppercase tracking-wider text-[var(--ink-hi)] transition active:scale-[0.97]"
            >
              Tournaments
            </Link>
            <Link
              href="/organizer/organizations"
              className="inline-flex h-10 items-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] px-5 font-body text-xs font-black uppercase tracking-wider text-[var(--ink-hi)] transition active:scale-[0.97]"
            >
              Organizations
            </Link>
            <Link
              href="/organizer/payout"
              className="inline-flex h-10 items-center rounded-full border border-[var(--stroke)] bg-[var(--bg-surface)] px-5 font-body text-xs font-black uppercase tracking-wider text-[var(--ink-hi)] transition active:scale-[0.97]"
            >
              Payout
            </Link>
          </div>
        </motion.section>

        {/* Next game callout */}
        {nextGame && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...bouncy, delay: 0.1 }}
            className="rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold-dim)] p-4"
          >
            <p className="mb-1 font-body text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">
              Next up
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-black uppercase italic leading-none text-[var(--ink-hi)]">
                  {nextGame.title}
                </h2>
                <p className="mt-1 font-body text-xs text-[var(--ink-low)]">
                  {formatGameDate(nextGame.date_time)}
                </p>
              </div>
              <Link
                href={`/organizer/games/${nextGame.id}/manage`}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--bg-page)]/40 px-3 py-2 font-body text-[10px] font-black uppercase tracking-wider text-[var(--ink-hi)] transition active:scale-[0.97]"
              >
                Manage
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </motion.section>
        )}

        {/* Your games — image-first cards */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-body text-[10px] font-black uppercase tracking-[0.22em] text-[var(--ink-low)]">
                Event inventory
              </p>
              <h2 className="font-heading text-2xl font-black uppercase italic leading-none text-[var(--ink-hi)]">
                Your Games
              </h2>
            </div>
            <Link
              href="/organizer/create/match"
              className="font-body text-xs font-black uppercase tracking-wider text-[var(--gold)]"
            >
              New Game
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl border border-[var(--stroke)] bg-[var(--bg-surface)]"
                />
              ))}
            </div>
          ) : games.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={bouncy}
              className="rounded-2xl border border-dashed border-[var(--stroke)] bg-[var(--bg-surface)]/50 px-5 py-16 text-center"
            >
              <p className="font-heading text-2xl font-black uppercase italic text-[var(--ink-hi)]">
                No games yet
              </p>
              <p className="mx-auto mt-2 max-w-[22ch] font-body text-sm text-[var(--ink-low)]">
                Start with a match page — cover image, venue, teams, and price.
              </p>
              <Link
                href="/organizer/create/match"
                className="rondo-btn rondo-btn-primary mt-6 !w-auto !min-h-[44px] px-6 text-xs"
              >
                Create First Game
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {games.map((game, i) => {
                const capacity = Math.min(
                  100,
                  Math.round((game.game_players.length / Math.max(game.max_players, 1)) * 100)
                );
                return (
                  <motion.article
                    key={game.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...bouncy, delay: 0.08 + i * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-[var(--bg-surface)] transition hover:border-[var(--gold)]/25"
                  >
                    {/* Image — dominant, full width */}
                    <div className="relative h-44">
                      {game.banner_url ? (
                        <img
                          src={game.banner_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${gameGradient(game.id)}`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)]/90 via-[var(--bg-page)]/20 to-transparent" />

                      {/* Cover upload */}
                      <label
                        className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--bg-page)]/65 px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wide text-[var(--ink-mid)] backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ImagePlus size={10} />
                        {uploadingCoverId === game.id
                          ? "Uploading…"
                          : game.banner_url
                            ? "Change"
                            : "Cover"}
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

                      {/* Status badge */}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wide ${statusColor[game.status] ?? "bg-white/8 text-white/45"}`}
                      >
                        {game.status.replace("_", " ")}
                      </span>

                      {/* Title + meta overlaid at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-heading text-xl font-black uppercase italic leading-none text-[var(--ink-hi)]">
                          {game.title}
                        </h3>
                        <p className="mt-1 font-body text-xs text-[var(--ink-low)]">
                          {formatGameDate(game.date_time)}
                        </p>
                      </div>
                    </div>

                    {/* Footer strip */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-body text-xs text-[var(--ink-low)]">
                          <Users size={12} />
                          {game.game_players.length}/{game.max_players}
                        </span>
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {game.format}
                        </Badge>
                        {/* Capacity bar */}
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--stroke)]">
                          <div
                            className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                            style={{ width: `${capacity}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-base font-black italic text-[var(--gold)]">
                          {formatPrice(game.price_per_player)}
                        </span>
                        <Link
                          href={`/organizer/games/${game.id}/manage`}
                          className="inline-flex min-h-[32px] items-center gap-0.5 rounded-lg bg-[var(--bg-inset)] px-3 font-body text-[10px] font-black uppercase tracking-wider text-[var(--ink-hi)] transition active:scale-[0.97]"
                        >
                          Manage
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
