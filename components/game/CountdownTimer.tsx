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

  return (
    <div className={cn("tabular-nums font-black tracking-tighter", className)}>
      <span className={cn("transition-colors", isUrgent ? "text-destructive" : "text-rondo-black")}>
        {mins}:{secs}
      </span>
    </div>
  );
}
