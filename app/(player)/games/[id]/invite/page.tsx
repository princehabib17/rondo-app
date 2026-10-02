"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, LinkSimple, ShareNetwork, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Profile } from "@/lib/supabase/types";

interface InvitePlayer {
  id: string;
  profile: Profile | null;
}

interface InviteGame {
  id: string;
  title: string;
  venue_name: string;
  max_players?: number;
  game_players: InvitePlayer[];
}

export default function InvitePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<InviteGame | null>(null);
  const [players, setPlayers] = useState<InvitePlayer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("games")
        .select(
          "id, title, venue_name, max_players, game_players(id, profile:profiles(id, full_name, avatar_url, nationality))"
        )
        .eq("id", id)
        .single();
      if (data) {
        setGame(data as unknown as InviteGame);
        setPlayers((data.game_players as unknown as InvitePlayer[]) ?? []);
      }
    }
    load();
  }, [id]);

  const shareText = game
    ? `${game.title} at ${game.venue_name}. ${spotsLeftLabel(game)} Join me on Rondo:`
    : "Join me on Rondo:";
  // Built on tap: window isn't available during the server render.
  const matchUrl = () => `${window.location.origin}/games/${id}`;

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: game?.title ?? "Rondo match", text: shareText, url: matchUrl() }).catch(() => {});
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(matchUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Invite your crew" back fallbackHref={`/games/${id}`} />

      <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
        <section className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-[var(--r-pill)] bg-[var(--gold-dim)] text-[var(--gold)]">
            <UsersThree size={30} weight="duotone" aria-hidden />
          </span>
          <h2 className="mt-4 rondo-display text-[var(--ink-hi)]">Bring your squad</h2>
          <p className="mx-auto mt-2 max-w-xs rondo-body text-[var(--ink-low)]">
            {game ? `${game.title}. ${spotsLeftLabel(game)}` : "Send the match to your group chat."}
          </p>
        </section>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${matchUrl()}`)}`, "_blank", "noopener")
            }
            className="rondo-btn rondo-btn-primary"
          >
            <WhatsappLogo size={20} weight="fill" aria-hidden />
            Share on WhatsApp
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={copyLink} className="rondo-btn rondo-btn-secondary">
              {copied ? <Check size={18} weight="bold" aria-hidden /> : <LinkSimple size={18} weight="bold" aria-hidden />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={handleShare} className="rondo-btn rondo-btn-secondary">
              <ShareNetwork size={18} weight="bold" aria-hidden />
              More
            </button>
          </div>
          <button type="button" onClick={() => router.push(`/games/${id}`)} className="rondo-btn rondo-btn-ghost">
            Done
          </button>
        </div>

        {players.length > 0 && (
          <section className="space-y-3">
            <h3 className="rondo-label text-[var(--ink-low)]">Already in · {players.length}</h3>
            <div className="flex flex-wrap gap-4">
              {players.map((gp) =>
                gp.profile ? (
                  <div key={gp.id} className="flex w-12 flex-col items-center gap-1">
                    <PlayerAvatar profile={gp.profile} size="md" showFlag linkable />
                    <span className="w-full truncate text-center rondo-meta text-[var(--ink-low)]">
                      {gp.profile.full_name?.split(" ")[0]}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function spotsLeftLabel(game: InviteGame): string {
  const left = Math.max(0, (game.max_players ?? 0) - game.game_players.length);
  if (!game.max_players) return "";
  return left > 0 ? `${left} ${left === 1 ? "spot" : "spots"} left.` : "It's full, but the waitlist is open.";
}
