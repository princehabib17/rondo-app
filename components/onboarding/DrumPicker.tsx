"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  DRUM_HEIGHT,
  DRUM_ROW_HEIGHT,
  DRUM_VISIBLE_ROWS,
  drumIndexFromScroll,
  drumRowStyle,
} from "@/lib/onboarding/drum";
import { cn } from "@/lib/utils";

export type DrumColumn = {
  id: string;
  label: string;
  items: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  className?: string;
};

const PAD = ((DRUM_VISIBLE_ROWS - 1) / 2) * DRUM_ROW_HEIGHT;

export function DrumPicker({ columns }: { columns: DrumColumn[] }) {
  return (
    <div
      className="relative w-full select-none"
      style={{ height: DRUM_HEIGHT, perspective: "900px" }}
    >
      {/* Selection band */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[14px] border border-[color-mix(in_oklch,var(--gold)_35%,var(--stroke))] bg-[color-mix(in_oklch,var(--gold)_10%,var(--bg-inset))]"
        style={{ height: DRUM_ROW_HEIGHT }}
      />
      <div
        className="relative flex h-full gap-1"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
        }}
      >
        {columns.map((col) => (
          <DrumWheel key={col.id} column={col} />
        ))}
      </div>
    </div>
  );
}

function DrumWheel({ column }: { column: DrumColumn }) {
  const { items, selectedIndex, onChange, label, className } = column;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef(0);
  const settleTimer = useRef<number | undefined>(undefined);
  const lastEmitted = useRef(selectedIndex);

  const paint = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollTop / DRUM_ROW_HEIGHT;
    rowRefs.current.forEach((row, i) => {
      if (!row) return;
      const { rotateX, opacity, scale } = drumRowStyle(i - center);
      row.style.transform = `rotateX(${rotateX}deg) scale(${scale})`;
      row.style.opacity = String(opacity);
    });
  }, []);

  const settle = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = drumIndexFromScroll(el.scrollTop, items.length);
    if (index !== lastEmitted.current) {
      lastEmitted.current = index;
      onChange(index);
    }
  }, [items.length, onChange]);

  // Jump to the selected row on mount and whenever the parent changes it (e.g. day clamped).
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = selectedIndex * DRUM_ROW_HEIGHT;
    lastEmitted.current = selectedIndex;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: el.dataset.ready ? "smooth" : "auto" });
    }
    el.dataset.ready = "1";
    paint();
  }, [selectedIndex, items.length, paint]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(settleTimer.current);
    };
  }, []);

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, 110);
  }

  function scrollToIndex(i: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    scrollerRef.current?.scrollTo({ top: clamped * DRUM_ROW_HEIGHT, behavior: "smooth" });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const current = drumIndexFromScroll(scrollerRef.current?.scrollTop ?? 0, items.length);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      scrollToIndex(current + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      scrollToIndex(current - 1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      scrollToIndex(current + 5);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      scrollToIndex(current - 5);
    }
  }

  return (
    <div
      ref={scrollerRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${column.id}-${selectedIndex}`}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      data-testid={`drum-${column.id}`}
      className={cn(
        "relative h-full flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-contain rounded-[14px] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--gold)_45%,transparent)] [&::-webkit-scrollbar]:hidden",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div style={{ height: PAD }} aria-hidden />
      {items.map((item, i) => (
        <div
          key={`${item}-${i}`}
          id={`${column.id}-${i}`}
          ref={(node) => {
            rowRefs.current[i] = node;
          }}
          role="option"
          aria-selected={i === selectedIndex}
          onClick={() => scrollToIndex(i)}
          className={cn(
            "flex snap-center items-center justify-center font-body text-[1.4rem] tabular-nums tracking-tight will-change-transform",
            i === selectedIndex ? "font-bold text-[var(--ink-hi)]" : "font-medium text-[var(--ink-mid)]"
          )}
          style={{ height: DRUM_ROW_HEIGHT, backfaceVisibility: "hidden" }}
        >
          {item}
        </div>
      ))}
      <div style={{ height: PAD }} aria-hidden />
    </div>
  );
}
