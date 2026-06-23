"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { getDaysInMonth } from "date-fns";

const ITEM_H = 44;

function DrumColumn({
  items,
  selectedIndex,
  onSelect,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
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
      const id = setTimeout(() => {
        settling.current = false;
      }, 350);
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
      setTimeout(() => {
        settling.current = false;
      }, 350);
    }, 80);
  }

  return (
    <div className="relative flex-1 select-none" style={{ height: 3 * ITEM_H }}>
      {/* selection highlight band */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-white/15 bg-white/[0.06] rounded-lg"
        style={{ top: ITEM_H, height: ITEM_H }}
      />
      {/* top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        style={{ height: ITEM_H, background: "linear-gradient(to bottom, #050505 30%, transparent)" }}
      />
      {/* bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
        style={{ height: ITEM_H, background: "linear-gradient(to top, #050505 30%, transparent)" }}
      />
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-scroll"
        style={
          {
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          } as React.CSSProperties
        }
        onScroll={onScroll}
      >
        <div aria-hidden style={{ height: ITEM_H }} />
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-center font-semibold text-base transition-colors duration-100 ${
              i === selectedIndex ? "text-white" : "text-white/25"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!scrollRef.current) return;
              settling.current = true;
              scrollRef.current.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
              onSelect(i);
              setTimeout(() => {
                settling.current = false;
              }, 350);
            }}
          >
            {item}
          </div>
        ))}
        <div aria-hidden style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getYearList() {
  const y = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(y + i));
}

export interface DateDrumRollPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

export function DateDrumRollPicker({ value, onChange }: DateDrumRollPickerProps) {
  const YEARS = getYearList();
  const startYear = Number(YEARS[0]);

  const date = value ?? new Date();
  const monthIdx = date.getMonth();
  const dayIdx = date.getDate() - 1;
  const yearIdx = Math.max(0, Math.min(YEARS.length - 1, date.getFullYear() - startYear));

  const daysInMonth = getDaysInMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  function emit(mIdx: number, dIdx: number, yIdx: number) {
    const year = startYear + yIdx;
    const month = mIdx;
    const daysAvail = getDaysInMonth(new Date(year, month, 1));
    const day = Math.min(dIdx + 1, daysAvail);
    onChange(new Date(year, month, day));
  }

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white/[0.04] border border-white/10 px-2 py-2">
      <DrumColumn
        items={MONTHS}
        selectedIndex={monthIdx}
        onSelect={(i) => emit(i, dayIdx, yearIdx)}
      />
      <div className="w-px h-8 bg-white/10 shrink-0" />
      <DrumColumn
        items={DAYS}
        selectedIndex={Math.min(dayIdx, DAYS.length - 1)}
        onSelect={(i) => emit(monthIdx, i, yearIdx)}
      />
      <div className="w-px h-8 bg-white/10 shrink-0" />
      <DrumColumn
        items={YEARS}
        selectedIndex={yearIdx}
        onSelect={(i) => emit(monthIdx, dayIdx, i)}
      />
    </div>
  );
}
