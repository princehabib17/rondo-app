"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const ITEM_H = 44;

interface DrumColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function DrumColumn({ items, selectedIndex, onSelect }: DrumColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = selectedIndex * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settling.current && scrollRef.current) {
      settling.current = true;
      scrollRef.current.scrollTo({ top: selectedIndex * ITEM_H, behavior: "smooth" });
      const id = setTimeout(() => { settling.current = false; }, 350);
      return () => clearTimeout(id);
    }
  }, [selectedIndex]);

  function onScroll() {
    if (settling.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const idx = Math.round(scrollRef.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      settling.current = true;
      scrollRef.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      onSelect(clamped);
      setTimeout(() => { settling.current = false; }, 350);
    }, 80);
  }

  return (
    <div className="relative flex-1 select-none" style={{ height: 3 * ITEM_H }}>
      {/* selection band */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-white/15 bg-white/[0.06] rounded-lg"
        style={{ top: ITEM_H, height: ITEM_H }}
      />
      {/* top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        style={{
          height: ITEM_H,
          background: "linear-gradient(to bottom, hsl(var(--background)) 30%, transparent)",
        }}
      />
      {/* bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
        style={{
          height: ITEM_H,
          background: "linear-gradient(to top, hsl(var(--background)) 30%, transparent)",
        }}
      />

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        } as React.CSSProperties}
        onScroll={onScroll}
      >
        {/* top spacer — allows first item to center */}
        <div aria-hidden style={{ height: ITEM_H }} />
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-center font-semibold text-xl transition-colors duration-100 ${
              i === selectedIndex ? "text-white" : "text-white/25"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!scrollRef.current) return;
              settling.current = true;
              scrollRef.current.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
              onSelect(i);
              setTimeout(() => { settling.current = false; }, 350);
            }}
          >
            {item}
          </div>
        ))}
        {/* bottom spacer */}
        <div aria-hidden style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

export interface DrumRollPickerProps {
  /** "HH:MM" in 24-hour format */
  value: string;
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

export function DrumRollPicker({ value, onChange }: DrumRollPickerProps) {
  const [h24Raw, mRaw] = value ? value.split(":").map(Number) : [12, 0];
  const h24 = isNaN(h24Raw) ? 12 : h24Raw;
  const m = isNaN(mRaw) ? 0 : mRaw;

  const isPM = h24 >= 12;
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

  const hourIndex = h12 - 1;
  const minuteIndex = m;
  const periodIndex = isPM ? 1 : 0;

  function emit(hIdx: number, mIdx: number, pIdx: number) {
    const h = hIdx + 1;
    const pmNew = pIdx === 1;
    let h24New: number;
    if (h === 12) {
      h24New = pmNew ? 12 : 0;
    } else {
      h24New = pmNew ? h + 12 : h;
    }
    onChange(`${String(h24New).padStart(2, "0")}:${String(mIdx).padStart(2, "0")}`);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2">
      <DrumColumn
        items={HOURS}
        selectedIndex={hourIndex}
        onSelect={(i) => emit(i, minuteIndex, periodIndex)}
      />
      <span className="text-white/30 font-bold text-xl shrink-0 px-0.5 pb-0.5">:</span>
      <DrumColumn
        items={MINUTES}
        selectedIndex={minuteIndex}
        onSelect={(i) => emit(hourIndex, i, periodIndex)}
      />
      <div className="w-2" />
      <DrumColumn
        items={PERIODS}
        selectedIndex={periodIndex}
        onSelect={(i) => emit(hourIndex, minuteIndex, i)}
      />
    </div>
  );
}
