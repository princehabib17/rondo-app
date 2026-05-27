"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  roundStartTime: string | null;
  roundDurationMinutes: number;
  status: "waiting" | "running" | "paused" | "finished";
  className?: string;
}

export function CountdownTimer({ roundStartTime, roundDurationMinutes, status, className }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(roundDurationMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousSecondsRef = useRef(secondsLeft);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("timer_sound_enabled");
    soundEnabledRef.current = saved !== "0";
  }, []);

  useEffect(() => {
    if (status === "running" && roundStartTime) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - new Date(roundStartTime).getTime()) / 1000);
        const remaining = Math.max(0, roundDurationMinutes * 60 - elapsed);
        setSecondsLeft(remaining);
        if (remaining === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 500);
    } else if (status === "paused" || status === "waiting") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (status === "waiting") setSecondsLeft(roundDurationMinutes * 60);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [roundStartTime, roundDurationMinutes, status]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  const isUrgent = secondsLeft <= 60 && status === "running";

  useEffect(() => {
    const prev = previousSecondsRef.current;
    previousSecondsRef.current = secondsLeft;
    if (status !== "running" || !soundEnabledRef.current) return;
    if (secondsLeft === prev) return;

    if (secondsLeft <= 10 && secondsLeft > 0) {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.03;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.08);
      }
    }

    if (secondsLeft === 0 && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("Round over");
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [secondsLeft, status]);

  return (
    <div className={cn("tabular-nums font-black tracking-tighter", className)}>
      <span className={cn(
        "transition-colors text-lg",
        isUrgent ? "text-destructive animate-pulse" : "text-primary-foreground"
      )}>
        {mins}:{secs}
      </span>
    </div>
  );
}
