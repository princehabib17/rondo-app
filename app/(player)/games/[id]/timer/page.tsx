"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTimer } from "@/lib/realtime";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import type { TimerSession, RotationRound, Team } from "@/lib/supabase/types";

export default function PlayerTimerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [timer, setTimer] = useState<TimerSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roundDuration, setRoundDuration] = useState(8);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [announcedRound, setAnnouncedRound] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("timer_sound_enabled");
    setSoundEnabled(saved !== "0");
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("timer_sound_enabled", next ? "1" : "0");
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: timerData }, { data: teamsData }, { data: gameData }] = await Promise.all([
        supabase.from("timer_sessions").select("*").eq("game_id", id).single(),
        supabase.from("teams").select("*").eq("game_id", id).order("slot_number"),
        supabase.from("games").select("round_duration_minutes").eq("id", id).single(),
      ]);
      if (timerData) setTimer(timerData as TimerSession);
      setTeams((teamsData as Team[]) ?? []);
      if (gameData?.round_duration_minutes) setRoundDuration(gameData.round_duration_minutes);
    }
    load();
    const unsubscribe = subscribeToTimer(id, setTimer);
    return () => { unsubscribe(); };
  }, [id]);

  const schedule = timer?.rotation_schedule as RotationRound[] | null;
  const currentRound = timer?.current_round ?? 1;
  const nextRound = schedule?.find((r) => r.round === currentRound + 1);
  const teamA = teams.find((t) => t.id === timer?.current_team_a_id);
  const teamB = teams.find((t) => t.id === timer?.current_team_b_id);

  useEffect(() => {
    if (!soundEnabled || !timer || timer.status !== "running") return;
    if (announcedRound === timer.current_round) return;
    const current = schedule?.find((r) => r.round === timer.current_round);
    if (!current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(`Next: ${current.team_a_name} versus ${current.team_b_name}`);
    window.speechSynthesis.speak(utterance);
    setAnnouncedRound(timer.current_round);
  }, [timer, soundEnabled, schedule, announcedRound]);

  return (
    <div className="min-h-[100dvh] bg-rondo-yellow flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-rondo-black/60 hover:text-rondo-black transition-colors cursor-pointer active:scale-[0.98]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-rondo-black font-black text-sm uppercase tracking-widest">Live Match</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="text-[10px] uppercase tracking-wider border border-rondo-black/30 rounded-full px-2 py-1 text-rondo-black/70"
          >
            {soundEnabled ? "Sound On" : "Sound Off"}
          </button>
          <div className={`w-2 h-2 rounded-full ${timer?.status === "running" ? "bg-green-600 animate-pulse" : "bg-rondo-black/30"}`} />
          <span className="text-rondo-black/60 text-xs font-semibold capitalize">{timer?.status ?? "waiting"}</span>
        </div>
      </header>

      {/* Big timer */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6">
        <CountdownTimer
          roundStartTime={timer?.round_start_time ?? null}
          roundDurationMinutes={roundDuration}
          status={timer?.status ?? "waiting"}
          className="text-[96px] leading-none"
        />

        {/* Current matchup */}
        {teamA && teamB && (
          <div className="flex items-center gap-4 mt-2">
            <div className="text-center">
              <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: teamA.color }} />
              <span className="text-rondo-black font-black text-lg">{teamA.name}</span>
            </div>
            <span className="text-rondo-black/40 font-black text-2xl">VS</span>
            <div className="text-center">
              <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: teamB.color }} />
              <span className="text-rondo-black font-black text-lg">{teamB.name}</span>
            </div>
          </div>
        )}

        {/* Round indicator */}
        {schedule && schedule.length > 0 && (
          <p className="text-rondo-black/50 text-sm font-semibold">
            Round {currentRound} of {schedule.length}
          </p>
        )}
      </div>

      {/* Next up */}
      {nextRound && (
        <div className="px-6 pb-8">
          <div className="bg-rondo-black/10 rounded-2xl p-4">
            <p className="text-rondo-black/60 text-xs font-semibold uppercase tracking-wider mb-2">Next Up</p>
            <div className="flex items-center gap-2 text-rondo-black font-bold">
              <span>{nextRound.team_a_name}</span>
              <ChevronRight size={16} className="text-rondo-black/40" />
              <span>{nextRound.team_b_name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
