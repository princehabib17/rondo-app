"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Timer, CreditCard, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatGameDate } from "@/lib/utils/format";
import type { Game, Team, GamePlayer, Profile, PaymentStatus } from "@/lib/supabase/types";

type ManagedPlayer = GamePlayer & { profile: Profile | null };
type GameBase = Omit<Game, "teams" | "game_players"> & { teams: Team[] };

const STATUS_STYLE: Record<string, string> = {
  paid: "text-green-400 bg-green-400/10",
  approved: "text-green-400/70 bg-green-400/10",
  venue: "text-rondo-accent bg-rondo-accent/10",
  pending_payment: "text-white/40 bg-white/8",
  reserved: "text-blue-400 bg-blue-400/10",
  no_show: "text-red-400 bg-red-400/10",
  refund_requested: "text-orange-400 bg-orange-400/10",
  cancelled: "text-white/20 bg-white/5",
};

export default function ManageGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gameBase, setGameBase] = useState<GameBase | null>(null);
  const [allPlayers, setAllPlayers] = useState<ManagedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadGame = useCallback(async () => {
    const supabase = createClient();
    const [{ data: gameData }, { data: playersData }] = await Promise.all([
      supabase
        .from("games")
        .select("id, title, date_time, status, registration_open, format, max_players, price_per_player, teams(id, name, color, slot_number)")
        .eq("id", id)
        .single(),
      supabase
        .from("game_players")
        .select("id, user_id, team_id, payment_status, profile:profiles(id, full_name, avatar_url, nationality)")
        .eq("game_id", id),
    ]);
    if (gameData) setGameBase(gameData as unknown as GameBase);
    setAllPlayers((playersData as unknown as ManagedPlayer[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadGame(); }, [loadGame]);

  // Derived views — instant, no DB round-trips
  const byTeam = useMemo(() => {
    if (!gameBase) return {} as Record<string, ManagedPlayer[]>;
    return (gameBase.teams ?? []).reduce<Record<string, ManagedPlayer[]>>((acc, team) => {
      acc[team.id] = allPlayers.filter((p) => p.team_id === team.id);
      return acc;
    }, {});
  }, [gameBase, allPlayers]);

  const unassigned = useMemo(() => allPlayers.filter((p) => !p.team_id), [allPlayers]);

  // ── Optimistic mutations ─────────────────────────────────────────────
  function assignTeam(playerId: string, teamId: string) {
    setAllPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, team_id: teamId } : p));
    createClient().from("game_players").update({ team_id: teamId }).eq("id", playerId)
      .then(({ error }) => { if (error) loadGame(); });
  }

  function removePlayer(playerId: string) {
    setAllPlayers((prev) => prev.filter((p) => p.id !== playerId));
    createClient().from("game_players").delete().eq("id", playerId)
      .then(({ error }) => { if (error) loadGame(); });
  }

  function updateStatus(playerId: string, status: string) {
    setAllPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, payment_status: status as PaymentStatus } : p));
    createClient().from("game_players").update({ payment_status: status }).eq("id", playerId)
      .then(({ error }) => { if (error) loadGame(); });
  }

  function setGameStatus(status: "open" | "cancelled") {
    setGameBase((prev) => prev ? { ...prev, status } : prev);
    setShowCancelConfirm(false);
    createClient().from("games").update({ status }).eq("id", id)
      .then(({ error }) => { if (error) loadGame(); });
  }

  function toggleRegistration() {
    const next = !gameBase?.registration_open;
    setGameBase((prev) => prev ? { ...prev, registration_open: next } : prev);
    createClient().from("games").update({ registration_open: next }).eq("id", id)
      .then(({ error }) => { if (error) loadGame(); });
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black p-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-[#141414] border border-white/8 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!gameBase) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white/40 text-sm">
        Game not found
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black pb-10">
      <header className="sticky top-0 z-40 bg-black border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-white/70 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate leading-tight">{gameBase.title}</p>
          <p className="text-white/40 text-xs">{formatGameDate(gameBase.date_time)}</p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[gameBase.status] ?? "text-white/40 bg-white/5"}`}>
          {gameBase.status}
        </span>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <ActionBtn icon={<Megaphone size={16} />} label="Announce" onClick={() => router.push(`/organizer/games/${id}/announce`)} />
          <ActionBtn icon={<CreditCard size={16} />} label="Payments" onClick={() => router.push(`/organizer/games/${id}/payments`)} />
          <ActionBtn icon={<Timer size={16} />} label="Timer" onClick={() => router.push(`/organizer/games/${id}/timer`)} />
        </div>

        {/* Game controls */}
        <div className="flex gap-2">
          <button
            onClick={toggleRegistration}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
              gameBase.registration_open
                ? "border-white/15 text-white/60 bg-transparent"
                : "border-rondo-accent/40 text-rondo-accent bg-rondo-accent/8"
            }`}
          >
            {gameBase.registration_open ? "Close Registration" : "Registration Closed"}
          </button>
          {gameBase.status !== "cancelled" ? (
            showCancelConfirm ? (
              <button
                onClick={() => setGameStatus("cancelled")}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-900/40 border border-red-700/50 text-red-300"
              >
                Confirm Cancel
              </button>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400/70 border border-white/8"
              >
                Cancel Game
              </button>
            )
          ) : (
            <button
              onClick={() => setGameStatus("open")}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-green-800/50 text-green-400"
            >
              Reopen
            </button>
          )}
        </div>

        {/* Unassigned players */}
        {unassigned.length > 0 && (
          <section className="bg-[#141414] border border-rondo-accent/20 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rondo-accent animate-pulse" />
              <span className="text-white font-bold text-sm">Unassigned ({unassigned.length})</span>
            </div>
            <div className="divide-y divide-white/5">
              {unassigned.map((gp) =>
                gp.profile ? (
                  <div key={gp.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
                      <span className="text-white text-sm flex-1">{gp.profile.full_name}</span>
                      <StatusBadge status={gp.payment_status} playerId={gp.id} onChange={updateStatus} />
                    </div>
                    <div className="flex gap-1.5 flex-wrap pl-10">
                      {gameBase.teams?.sort((a, b) => a.slot_number - b.slot_number).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => assignTeam(gp.id, t.id)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white active:scale-95 transition-all"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Teams */}
        <div className="space-y-3">
          {gameBase.teams?.sort((a, b) => a.slot_number - b.slot_number).map((team) => {
            const players = byTeam[team.id] ?? [];
            return (
              <section key={team.id} className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                  <span className="text-white font-bold text-sm">{team.name}</span>
                  <span className="text-white/30 text-xs ml-auto">{players.length} players</span>
                </div>
                {players.length === 0 ? (
                  <p className="px-4 py-3 text-white/25 text-xs">No players yet</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {players.map((gp) =>
                      gp.profile ? (
                        <PlayerRow
                          key={gp.id}
                          gp={gp}
                          teams={gameBase.teams}
                          currentTeamId={team.id}
                          onStatusChange={updateStatus}
                          onAssignTeam={assignTeam}
                          onRemove={removePlayer}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {allPlayers.length === 0 && (
          <p className="text-center text-white/25 text-sm py-8">No players have joined yet.</p>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#141414] border border-white/8 rounded-xl py-3 flex flex-col items-center gap-1.5 text-white/70 active:scale-95 active:border-rondo-accent/30 transition-all"
    >
      <span className="text-rondo-accent">{icon}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function StatusBadge({
  status,
  playerId,
  onChange,
}: {
  status: string;
  playerId: string;
  onChange: (id: string, status: string) => void;
}) {
  const style = STATUS_STYLE[status] ?? "text-white/40 bg-white/5";
  return (
    <select
      value={status}
      onChange={(e) => onChange(playerId, e.target.value)}
      className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border-0 cursor-pointer ${style}`}
    >
      <option value="pending_payment">Pending</option>
      <option value="venue">At Venue</option>
      <option value="approved">Approved</option>
      <option value="no_show">No Show</option>
      <option value="refund_requested">Refund</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function PlayerRow({
  gp,
  teams,
  currentTeamId,
  onStatusChange,
  onAssignTeam,
  onRemove,
}: {
  gp: ManagedPlayer;
  teams: Team[];
  currentTeamId: string;
  onStatusChange: (id: string, status: string) => void;
  onAssignTeam: (playerId: string, teamId: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!gp.profile) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar profile={gp.profile} size="sm" showFlag linkable={false} />
        <span className="text-white text-sm flex-1 min-w-0 truncate">{gp.profile.full_name}</span>
        <StatusBadge status={gp.payment_status} playerId={gp.id} onChange={onStatusChange} />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/25 hover:text-white/50 transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pl-10 flex items-center gap-2 flex-wrap">
          {teams
            .filter((t) => t.id !== currentTeamId)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => { onAssignTeam(gp.id, t.id); setExpanded(false); }}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white active:scale-95 transition-all"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                Move to {t.name}
              </button>
            ))}
          <button
            onClick={() => onRemove(gp.id)}
            className="text-[11px] px-2 py-1 rounded-lg border border-red-900/50 text-red-400/70 hover:text-red-300 active:scale-95 transition-all"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
