"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChatCircleText, Megaphone, PaperPlaneRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";
import type { Tournament, TournamentMessage, TournamentTeam, TournamentTeamMember } from "@/lib/supabase/types";
import { EmptyState } from "@/components/rondo/primitives";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export default function TournamentRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [members, setMembers] = useState<TournamentTeamMember[]>([]);
  const [messages, setMessages] = useState<TournamentMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }, { data: t }, { data: teamRows }, { data: memberRows }, { data: messageRows }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase.from("tournaments").select("*").eq("id", id).single(),
        supabase
          .from("tournament_teams")
          .select("*")
          .eq("tournament_id", id)
          .eq("status", "registered")
          .order("created_at", { ascending: true }),
        supabase.from("tournament_team_members").select("*").eq("tournament_id", id),
        supabase
          .from("tournament_messages")
          .select(`*, author:profiles!user_id(${PUBLIC_PROFILE_SELECT})`)
          .eq("tournament_id", id)
          .order("created_at", { ascending: true })
          .limit(100),
      ]);

    setUserId(userData.user?.id ?? null);
    setTournament((t as Tournament) ?? null);
    setTeams((teamRows as TournamentTeam[]) ?? []);
    setMembers((memberRows as TournamentTeamMember[]) ?? []);
    setMessages((messageRows as TournamentMessage[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tournament-room-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_messages", filter: `tournament_id=eq.${id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  // Roster membership makes you "in" here, not just captaining the team.
  const myTeam = useMemo(() => {
    if (!userId) return null;
    const captained = teams.find((team) => team.captain_id === userId && !team.is_managed);
    if (captained) return captained;
    const membership = members.find((m) => m.user_id === userId);
    return membership ? teams.find((team) => team.id === membership.team_id) ?? null : null;
  }, [teams, members, userId]);
  const canPost = !!userId && !!tournament && (tournament.organizer_id === userId || !!myTeam);

  async function send() {
    const text = body.trim();
    if (!text || sending || !userId || !tournament) return;
    setSending(true);
    const supabase = createClient();
    const kind = tournament.organizer_id === userId && text.startsWith("!") ? "announcement" : "text";
    const cleanBody = kind === "announcement" ? text.replace(/^!+\s*/, "") : text;
    const { error } = await supabase.from("tournament_messages").insert({
      tournament_id: id,
      user_id: userId,
      kind,
      body: cleanBody,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send that. Tap to retry.");
      return;
    }
    setBody("");
    await load();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col rondo-page">
      <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav px-4 py-3">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-3">
          <Link
            href={`/tournaments/${id}`}
            aria-label="Back to tournament"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--r-pill)] text-[var(--ink-mid)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="rondo-label text-[var(--gold)]">Tournament room</p>
            <h1 className="truncate rondo-title text-[var(--ink-hi)]">{tournament?.name ?? "Locker room"}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <div className="mb-4 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
          <p className="rondo-meta text-[var(--ink-mid)]">
            {myTeam ? `You're in with ${myTeam.name}.` : "Team rosters and organizers can post here."}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 rounded-[var(--r-md)] rondo-shimmer" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title="Room is quiet" body="Post the first schedule note, reminder, or bit of matchday noise." />
        ) : (
          <div className="flex-1 space-y-3 pb-24">
            {messages.map((message) => {
              const announcement = message.kind === "announcement";
              const mine = message.user_id === userId;
              return (
                <article
                  key={message.id}
                  className={cn(
                    "flex gap-3 rounded-[var(--r-md)] border p-3",
                    announcement
                      ? "border-[var(--gold)] bg-[var(--gold-dim)]"
                      : "border-[var(--stroke)] bg-[var(--bg-surface)]",
                    mine && "border-[color-mix(in_oklch,var(--gold)_45%,var(--stroke))]"
                  )}
                >
                  {message.author && (
                    <PlayerAvatar profile={message.author} size="xs" showFlag={false} linkable={false} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate rondo-meta font-bold text-[var(--ink-hi)]">
                        {message.author?.full_name ?? "Player"}
                      </p>
                      {announcement && <Megaphone size={14} weight="fill" className="text-[var(--gold)]" />}
                      <span className="rondo-meta text-[var(--ink-low)]">{formatRelativeTime(message.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap rondo-body text-[var(--ink-mid)]">{message.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* bottom-6rem (not 4rem): clears the floating BottomNav pill, which
          occupies 24-84px from the viewport edge, not just its top 64px. */}
      <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 rondo-sticky-action">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-3">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, 1000))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            disabled={!canPost}
            placeholder={canPost ? "Message the room" : "Join a team's roster to post"}
            className="h-12 min-w-0 flex-1 rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 rondo-body text-[var(--ink-hi)] outline-none placeholder:text-[var(--ink-low)] focus:border-[var(--gold)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!body.trim() || sending || !canPost}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--r-pill)] bg-[var(--gold)] text-[var(--gold-ink)] disabled:opacity-40"
            aria-label="Send message"
          >
            {body.trim() ? <PaperPlaneRight size={20} weight="fill" /> : <ChatCircleText size={20} weight="bold" />}
          </button>
        </div>
      </div>
    </div>
  );
}
