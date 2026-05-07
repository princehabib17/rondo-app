"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, ChevronRight, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTimer } from "@/lib/realtime";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { generateRotationSchedule } from "@/lib/utils/rotation";
import type { TimerSession, RotationRound, Team } from "@/lib/supabase/types";

export default function OrganizerTimerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [timer, setTimer] = useState<TimerSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roundDuration, setRoundDuration] = useState(8);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: timerData }, { data: teamsData }, { data: gameData }] = await Promise.all([
        supabase.from("timer_sessions").select("*").eq("game_id", id).maybeSingle(),
        supabase.from("teams").select("*").eq("game_id", id).order("slot_number"),
        supabase.from("games").select("round_duration_minutes").eq("id", id).single(),
      ]);
      setTimer(timerData as TimerSession | null);
      setTeams((teamsData as Team[]) ?? []);
      if (gameData?.round_duration_minutes) setRoundDuration(gameData.round_duration_minutes);
    }
    load();
    const unsubscribe = subscribeToTimer(id, setTimer);
    return () => { unsubscribe(); };
  }, [id]);

  async function initTimer() {
    const supabase = createClient();
    const schedule = generateRotationSchedule(teams);
    const first = schedule[0];
    const { data } = await supabase
      .from("timer_sessions")
      .upsert(
        {
          game_id: id,
          current_round: 1,
          current_team_a_id: first?.team_a_id ?? null,
          current_team_b_id: first?.team_b_id ?? null,
          status: "waiting",
          rotation_schedule: schedule,
        },
        { onConflict: "game_id" }
      )
      .select()
      .single();
    if (data) setTimer(data as TimerSession);
  }

  async function handleStart() {
    if (!timer) return;
    setActionLoading(true);
    const supabase = createClient();
    await supabase
      .from("timer_sessions")
      .update({
        status: "running",
        round_start_time: new Date().toISOString(),
      })
      .eq("game_id", id);
    setActionLoading(false);
  }

  async function handlePause() {
    if (!timer) return;
    const supabase = createClient();
    await supabase.from("timer_sessions").update({ status: "paused" }).eq("game_id", id);
  }

  async function handleNextRound() {
    if (!timer) return;
    setActionLoading(true);
    const supabase = createClient();
    const schedule = timer.rotation_schedule as RotationRound[] | null;
    const nextRoundNum = (timer.current_round ?? 1) + 1;
    const next = schedule?.find((r) => r.round === nextRoundNum);

    if (!next) {
      await supabase.from("timer_sessions").update({ status: "finished" }).eq("game_id", id);
    } else {
      await supabase.from("timer_sessions").update({
        current_round: nextRoundNum,
        current_team_a_id: next.team_a_id,
        current_team_b_id: next.team_b_id,
        status: "running",
        round_start_time: new Date().toISOString(),
      }).eq("game_id", id);
    }
    setActionLoading(false);
  }

  const schedule = timer?.rotation_schedule as RotationRound[] | null;
  const currentRound = timer?.current_round ?? 1;
  const teamA = teams.find((t) => t.id === timer?.current_team_a_id);
  const teamB = teams.find((t) => t.id === timer?.current_team_b_id);

  return (
    <div className="min-h-[100dvh] bg-rondo-yellow flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-rondo-black/60 hover:text-rondo-black transition-colors cursor-pointer active:scale-[0.98]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-rondo-black font-black text-sm uppercase tracking-widest">Timer Control</span>
        <div className="ml-auto">
          <span className="text-rondo-black/50 text-xs font-semibold capitalize">
            {timer?.status ?? "not started"}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6">
        {!timer ? (
          <div className="text-center space-y-4">
            <p className="text-rondo-black/60 text-sm">Timer not initialized</p>
            <button
              onClick={initTimer}
              className="bg-rondo-black text-rondo-yellow font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
            >
              Initialize Timer
            </button>
          </div>
        ) : (
          <>
            <CountdownTimer
              roundStartTime={timer.round_start_time}
              roundDurationMinutes={roundDuration}
              status={timer.status}
              className="text-[80px] leading-none"
            />

            {teamA && teamB && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: teamA.color }} />
                  <span className="text-rondo-black font-black text-lg">{teamA.name}</span>
                </div>
                <span className="text-rondo-black/40 font-black text-xl">VS</span>
                <div className="text-center">
                  <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: teamB.color }} />
                  <span className="text-rondo-black font-black text-lg">{teamB.name}</span>
                </div>
              </div>
            )}

            {schedule && (
              <p className="text-rondo-black/50 text-sm font-semibold">
                Round {currentRound} of {schedule.length}
              </p>
            )}

            <div className="flex gap-3">
              {timer.status === "waiting" || timer.status === "paused" ? (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="bg-rondo-black text-rondo-yellow rounded-full w-16 h-16 flex items-center justify-center active:scale-[0.95] transition-all cursor-pointer disabled:opacity-50"
                  aria-label="Start"
                >
                  <Play size={28} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="bg-rondo-black/20 text-rondo-black rounded-full w-16 h-16 flex items-center justify-center active:scale-[0.95] transition-all cursor-pointer"
                  aria-label="Pause"
                >
                  <Pause size={28} />
                </button>
              )}
              <button
                onClick={handleNextRound}
                disabled={actionLoading || timer.status === "finished"}
                className="bg-rondo-black/20 text-rondo-black rounded-full w-16 h-16 flex items-center justify-center active:scale-[0.95] transition-all cursor-pointer disabled:opacity-40"
                aria-label="Next round"
              >
                <RotateCcw size={24} />
              </button>
            </div>
          </>
        )}
      </div>

      {schedule && schedule.length > 0 && (
        <div className="px-4 pb-8 space-y-2 max-h-48 overflow-y-auto">
          <p className="text-rondo-black/50 text-xs font-semibold uppercase tracking-wider">Schedule</p>
          {schedule.map((r) => (
            <div
              key={r.round}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${
                r.round === currentRound
                  ? "bg-rondo-black/10 text-rondo-black font-bold"
                  : "text-rondo-black/50"
              }`}
            >
              <span className="w-4 text-xs">{r.round}.</span>
              <span>{r.team_a_name}</span>
              <ChevronRight size={14} className="text-rondo-black/30" />
              <span>{r.team_b_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
