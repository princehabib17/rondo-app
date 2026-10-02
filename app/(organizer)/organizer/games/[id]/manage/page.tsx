"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CurrencyCircleDollar, Megaphone, Timer } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatGameDate, formatPrice } from "@/lib/utils/format";
import type { Game, Team, GamePlayer, Profile, GameWaitlistEntry } from "@/lib/supabase/types";

interface ManagedGame extends Game {
  teams: (Team & { game_players: (GamePlayer & { profile: Profile | null })[] })[];
}

type WaitlistRow = GameWaitlistEntry & { profile: Profile | null };

export default function ManageGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<ManagedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [unassigned, setUnassigned] = useState<(GamePlayer & { profile: Profile | null })[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [addingWaitlistId, setAddingWaitlistId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const loadGame = useCallback(async function loadGame() {
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setCurrentUserId(uid);

    if (!uid) {
      router.replace("/login");
      return;
    }

    // Fetch game — scoped to organizer_id so a non-organizer gets no data
    const { data } = await supabase
      .from("games")
      .select(`*, teams(id, name, color, slot_number, game_players(id, user_id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)))`)
      .eq("id", id)
      .eq("organizer_id", uid)
      .single();

    if (!data) {
      // Game doesn't exist or current user is not the organizer
      router.replace("/organizer/dashboard");
      return;
    }

    const gameData = data as unknown as ManagedGame;
    setGame(gameData);

    const { data: allGp } = await supabase
      .from("game_players")
      .select("id, user_id, team_id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)")
      .eq("game_id", id)
      .is("team_id", null);
    setUnassigned((allGp as unknown as (GamePlayer & { profile: Profile | null })[]) ?? []);

    const { data: wlData } = await supabase
      .from("game_waitlist")
      .select("*, profile:profiles(id, full_name, avatar_url, nationality)")
      .eq("game_id", id)
      .order("created_at", { ascending: true });
    setWaitlist((wlData as unknown as WaitlistRow[]) ?? []);

    setLoading(false);
  }, [id, router]);

  useEffect(() => { loadGame(); }, [loadGame]);

  async function assignTeam(playerId: string, teamId: string) {
    if (!currentUserId) return;
    // Verify the teamId belongs to this game (checked against already-loaded state)
    const teamBelongsToGame = game?.teams?.some((t) => t.id === teamId);
    if (!teamBelongsToGame) return;
    const supabase = createClient();
    // Scope update: player must belong to this game AND team must belong to this game
    const { error } = await supabase
      .from("game_players")
      .update({ team_id: teamId })
      .eq("id", playerId)
      .eq("game_id", id);
    if (error) toast.error("Could not move that player. Try again.");
    await loadGame();
  }

  async function postAction<T = Record<string, unknown>>(path: string, body: unknown): Promise<T | null> {
    const res = await fetch(`/api/organizer/games/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error ?? "Something went wrong. Try again.");
      return null;
    }
    return json as T;
  }

  async function removePlayer(playerId: string) {
    if (!currentUserId) return;
    const result = await postAction<{ refunded: number }>("remove-player", { playerId });
    setConfirmRemoveId(null);
    if (result) {
      toast.success(
        result.refunded > 0 ? `Player removed and refunded ${formatPrice(result.refunded)}` : "Player removed"
      );
    }
    await loadGame();
  }

  async function updatePlayerStatus(playerId: string, paymentStatus: string) {
    if (!currentUserId) return;
    const supabase = createClient();
    // Scope update to this game only
    const { error } = await supabase
      .from("game_players")
      .update({ payment_status: paymentStatus })
      .eq("id", playerId)
      .eq("game_id", id);
    if (error) toast.error("Could not update that player. Try again.");
    await loadGame();
  }

  async function approvePlayer(playerId: string) {
    const result = await postAction("approve-player", { playerId });
    if (result) toast.success("Player approved");
    await loadGame();
  }

  async function updateGameStatus(status: "cancelled" | "open") {
    if (!currentUserId) return;
    const result = await postAction<{ refundedPlayers?: number; refundedTotal?: number }>("status", { status });
    if (result) {
      if (status === "open") toast.success("Match reopened");
      else if (result.refundedPlayers)
        toast.success(
          `Match cancelled. Refunded ${formatPrice(result.refundedTotal ?? 0)} to ${result.refundedPlayers} ${result.refundedPlayers === 1 ? "player" : "players"}.`
        );
      else toast.success("Match cancelled");
    }
    await loadGame();
  }

  async function toggleRegistration() {
    if (!currentUserId) return;
    const supabase = createClient();
    // organizer_id guard ensures only the owner can toggle registration
    const opening = game?.registration_open === false;
    const { error } = await supabase
      .from("games")
      .update({ registration_open: opening })
      .eq("id", id)
      .eq("organizer_id", currentUserId);
    if (error) toast.error("Could not change registration. Try again.");
    else toast.success(opening ? "Registration open" : "Registration closed");
    await loadGame();
  }

  async function addFromWaitlist(waitlistId: string, teamId?: string | null) {
    setAddingWaitlistId(waitlistId);
    const res = await fetch(`/api/organizer/games/${id}/waitlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitlistId, teamId: teamId ?? null }),
    });
    setAddingWaitlistId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not add player");
      return;
    }
    toast.success("Added to the roster");
    await loadGame();
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-4">
        {[0,1,2].map((i) => <div key={i} className="h-24 bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] animate-pulse" />)}
      </div>
    );
  }

  if (!game) return <div className="min-h-[100dvh] flex items-center justify-center text-[var(--ink-low)]">Match not found</div>;

  const registrationOpen = game.registration_open !== false;

  return (
    <div className="min-h-[100dvh] pb-8">
      <PageHeader
        title={game.title}
        subtitle={formatGameDate(game.date_time)}
        back
        fallbackHref="/organizer/dashboard"
      />

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Announce", href: `/organizer/games/${id}/announce`, Icon: Megaphone },
            { label: "Timer", href: `/organizer/games/${id}/timer`, Icon: Timer },
            { label: "Payments", href: `/organizer/games/${id}/payments`, Icon: CurrencyCircleDollar },
          ].map(({ label, href, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-2 transition-transform duration-150 active:scale-[0.97]"
            >
              <Icon size={22} className="text-[var(--ink-hi)]" aria-hidden />
              <span className="rondo-meta font-semibold text-[var(--ink-hi)]">{label}</span>
            </button>
          ))}
        </div>

        <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--ink-hi)]">Registration</p>
              <p className="rondo-meta text-[var(--ink-low)]">
                {registrationOpen ? "Open. Players can join and pay." : "Closed. Nobody new can join."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={registrationOpen}
              aria-label="Registration open"
              onClick={toggleRegistration}
              disabled={game.status === "cancelled"}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-40 ${registrationOpen ? "border-transparent bg-[var(--ok)]" : "border-[var(--stroke)] bg-[var(--bg-inset)]"}`}
            >
              <span
                className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-200 ${registrationOpen ? "left-[calc(100%-1.5rem)]" : "left-1"}`}
              />
            </button>
          </div>

          {game.status === "cancelled" ? (
            <div className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink-hi)]">This match is cancelled</p>
                <p className="rondo-meta text-[var(--ink-low)]">Reopen it to take players again.</p>
              </div>
              <button
                type="button"
                onClick={() => updateGameStatus("open")}
                className="h-10 shrink-0 rounded-[var(--r-pill)] border border-[var(--stroke)] px-4 rondo-meta font-bold text-[var(--ink-hi)]"
              >
                Reopen
              </button>
            </div>
          ) : confirmCancel ? (
            <div className="space-y-3 p-4">
              <p className="text-sm font-bold text-[var(--ink-hi)]">Cancel this match?</p>
              <p className="rondo-meta text-[var(--ink-low)]">Everyone on the roster is told, and anyone who paid gets the fee back in their wallet.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { updateGameStatus("cancelled"); setConfirmCancel(false); }}
                  className="h-11 flex-1 rounded-[var(--r-pill)] bg-[var(--live)] text-sm font-bold text-white"
                >
                  Yes, cancel it
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="h-11 flex-1 rounded-[var(--r-pill)] border border-[var(--stroke)] text-sm font-semibold text-[var(--ink-hi)]"
                >
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="flex min-h-14 w-full items-center px-4 text-left text-sm font-semibold text-[var(--live)]"
            >
              Cancel match
            </button>
          )}
        </div>

        {/* Teams roster */}
        <div className="space-y-4">
          <h2 className="rondo-label text-[var(--ink-low)]">Roster</h2>

          {game.teams?.sort((a, b) => a.slot_number - b.slot_number).map((team) => (
            <div key={team.id} className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                <span className="text-[var(--ink-hi)] font-bold text-sm">{team.name}</span>
                <span className="text-[var(--ink-low)] text-xs ml-auto">{team.game_players?.length ?? 0} {(team.game_players?.length ?? 0) === 1 ? "player" : "players"}</span>
              </div>
              <div className="space-y-2">
                {(team.game_players ?? []).map((gp) => (
                  gp.profile && (
                    <div key={gp.id} className="space-y-2 rounded-[var(--r-sm)] bg-[var(--bg-inset)] p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
                        <span className="min-w-0 flex-1 truncate rondo-body font-bold text-[var(--ink-hi)]">
                          {gp.profile.full_name}
                        </span>
                        {confirmRemoveId === gp.id ? (
                          <span className="flex shrink-0 items-center">
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(null)}
                              className="inline-flex min-h-11 items-center px-2 rondo-meta font-semibold text-[var(--ink-mid)]"
                            >
                              Keep
                            </button>
                            <button
                              type="button"
                              onClick={() => removePlayer(gp.id)}
                              aria-label={`Confirm removing ${gp.profile.full_name ?? "player"}`}
                              className="inline-flex min-h-11 items-center px-2 rondo-meta font-bold text-[var(--live)]"
                            >
                              Remove
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(gp.id)}
                            aria-label={`Remove ${gp.profile.full_name ?? "player"}`}
                            className="inline-flex min-h-11 shrink-0 items-center rondo-meta font-semibold text-[var(--ink-low)]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={gp.payment_status}
                          onChange={(e) => updatePlayerStatus(gp.id, e.target.value)}
                          aria-label={`Status for ${gp.profile.full_name ?? "player"}`}
                          className="h-10 min-w-0 flex-1 rounded-[var(--r-sm)] border border-[var(--stroke)] bg-[var(--bg-surface)] px-3 rondo-meta text-[var(--ink-hi)]"
                        >
                          <option value="pending_approval">Pending approval</option>
                          <option value="pending_payment">Pending payment</option>
                          <option value="paid">Paid</option>
                          <option value="approved">Approved</option>
                          <option value="reserved">Reserved</option>
                          <option value="venue">Pay at venue</option>
                          <option value="no_show">No-show</option>
                          <option value="refund_requested">Refund requested</option>
                          {gp.payment_status === "refunded" && <option value="refunded">Refunded</option>}
                        </select>
                        {gp.payment_status === "pending_approval" && (
                          <button
                            type="button"
                            onClick={() => approvePlayer(gp.id)}
                            className="h-10 shrink-0 rounded-[var(--r-pill)] bg-[var(--gold)] px-4 rondo-meta font-bold text-[var(--gold-ink)]"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ))}
                {(team.game_players?.length ?? 0) === 0 && (
                  <p className="text-[var(--ink-low)] text-xs">No players yet</p>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-3">
              <span className="text-sm font-bold text-[var(--ink-mid)]">No team yet</span>
              {unassigned.slice().sort((a, b) => (a.profile?.full_name ?? "").localeCompare(b.profile?.full_name ?? "")).map((gp) => (
                gp.profile && (
                  <div key={gp.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink-hi)]">{gp.profile.full_name}</span>
                      {confirmRemoveId === gp.id ? (
                        <span className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="inline-flex min-h-11 items-center px-2 rondo-meta font-semibold text-[var(--ink-mid)]"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={() => removePlayer(gp.id)}
                            aria-label={`Confirm removing ${gp.profile.full_name ?? "player"}`}
                            className="inline-flex min-h-11 items-center px-2 rondo-meta font-bold text-[var(--live)]"
                          >
                            Remove
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(gp.id)}
                          aria-label={`Remove ${gp.profile.full_name ?? "player"}`}
                          className="inline-flex min-h-11 shrink-0 items-center rondo-meta font-semibold text-[var(--ink-low)]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap ml-12">
                      {game.teams?.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => assignTeam(gp.id, t.id)}
                          className="min-h-9 rounded-[var(--r-pill)] border border-[var(--stroke)] px-3 text-xs font-semibold text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                        >
                          Move to {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {waitlist.length > 0 && (
          <div className="space-y-3">
            <h2 className="rondo-label text-[var(--ink-low)]">Waitlist · {waitlist.length}</h2>
            <p className="text-[var(--ink-low)] text-xs">
              No order. Notify everyone when a spot opens, or add someone below.
            </p>
            <div className="bg-[var(--bg-surface)] border border-[var(--stroke)] rounded-[var(--r-md)] divide-y divide-[var(--stroke)]">
              {waitlist.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {row.profile ? (
                      <PlayerAvatar profile={row.profile} size="sm" showFlag linkable={false} />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--ink-hi)] text-sm font-semibold truncate">
                        {row.profile?.full_name ?? "Player"}
                      </p>
                      <p className="text-[var(--ink-low)] text-xs">
                        Joined {new Date(row.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        {row.team_id
                          ? ` · prefers ${game.teams?.find((t) => t.id === row.team_id)?.name ?? "team"}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={addingWaitlistId === row.id}
                      onClick={() => addFromWaitlist(row.id, row.team_id)}
                      className="min-h-9 shrink-0 rounded-[var(--r-pill)] bg-[var(--ink-hi)] px-3 text-xs font-bold text-[var(--bg-page)] disabled:opacity-50"
                    >
                      {addingWaitlistId === row.id ? "Adding…" : "Add to roster"}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap ml-12">
                    {game.teams?.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={addingWaitlistId === row.id}
                        onClick={() => addFromWaitlist(row.id, t.id)}
                        className="min-h-9 rounded-[var(--r-pill)] border border-[var(--stroke)] px-3 text-xs font-semibold text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)] disabled:opacity-50"
                      >
                        Add to {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
