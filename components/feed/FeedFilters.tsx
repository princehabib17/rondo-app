"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FEED_AREAS,
  DEFAULT_FILTERS,
  getActiveChips,
  clearChip,
  countActiveFilters,
  type FeedFilters,
  type SkillGroup,
  type SortKey,
  type DateFilter,
  type TimeFilter,
  type PriceFilter,
  type PrivacyFilter,
} from "@/lib/feed/filters";
import type { MatchType } from "@/lib/supabase/types";

interface FeedFiltersBarProps {
  filters: FeedFilters;
  onChange: (next: FeedFilters) => void;
  resultCount: number;
  onUseLocation: () => void;
  locating: boolean;
  hasLocation: boolean;
}

const QUICK_AREAS = ["BGC", "Makati", "Quezon City", "Pasig", "Ortigas", "Mandaluyong"];

export function FeedFiltersBar({
  filters,
  onChange,
  resultCount,
  onUseLocation,
  locating,
  hasLocation,
}: FeedFiltersBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);
  const chips = getActiveChips(filters);

  function toggleArea(area: string) {
    onChange({
      ...filters,
      areas: filters.areas.includes(area)
        ? filters.areas.filter((a) => a !== area)
        : [...filters.areas, area],
    });
  }

  return (
    <div className="px-4 pt-3">
      {/* Always-visible control row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            activeCount > 0
              ? "bg-rondo-accent text-black border-rondo-accent"
              : "bg-white/5 text-white/80 border-white/12 hover:border-white/25"
          )}
        >
          <SlidersHorizontal size={13} strokeWidth={2.5} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-black/20 text-black text-[10px] flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={locating}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            hasLocation
              ? "bg-rondo-accent/15 text-rondo-accent border-rondo-accent/30"
              : "bg-white/5 text-white/60 border-white/12 hover:border-white/25"
          )}
        >
          <MapPin size={12} />
          {locating ? "Locating…" : hasLocation ? "Near me ✓" : "Near me"}
        </button>

        {QUICK_AREAS.map((area) => {
          const active = filters.areas.includes(area);
          return (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/70 border-white/12 hover:border-white/25"
              )}
            >
              {area}
            </button>
          );
        })}
      </div>

      {/* Active filter chips (clearable) */}
      {chips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(clearChip(filters, chip.key))}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-rondo-accent/15 border border-rondo-accent/25 text-rondo-accent px-2.5 py-1 text-[11px] font-semibold"
            >
              {chip.label}
              <X size={11} strokeWidth={3} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="shrink-0 text-white/50 hover:text-white text-[11px] font-semibold underline underline-offset-2 px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {open && (
        <FilterSheet
          filters={filters}
          onChange={onChange}
          onClose={() => setOpen(false)}
          resultCount={resultCount}
          onUseLocation={onUseLocation}
          locating={locating}
          hasLocation={hasLocation}
          toggleArea={toggleArea}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-white/50 text-[11px] uppercase tracking-wider mb-2">
      {children}
    </h3>
  );
}

function OptionChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "bg-rondo-accent text-black border-rondo-accent"
          : "bg-white/5 text-white/70 border-white/12 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}

interface FilterSheetProps extends Omit<FeedFiltersBarProps, "resultCount"> {
  onClose: () => void;
  resultCount: number;
  toggleArea: (area: string) => void;
}

function FilterSheet({
  filters,
  onChange,
  onClose,
  resultCount,
  onUseLocation,
  locating,
  hasLocation,
  toggleArea,
}: FilterSheetProps) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const matchTypes: MatchType[] = ["football", "futsal"];
  const skillGroups: SkillGroup[] = ["casual", "intermediate", "serious"];
  const dateOptions: { v: DateFilter; label: string }[] = [
    { v: "today", label: "Today" },
    { v: "tomorrow", label: "Tomorrow" },
    { v: "weekend", label: "Weekend" },
    { v: "week", label: "This week" },
  ];
  const timeOptions: { v: TimeFilter; label: string }[] = [
    { v: "morning", label: "Morning" },
    { v: "afternoon", label: "Afternoon" },
    { v: "evening", label: "Evening" },
  ];
  const priceOptions: { v: PriceFilter; label: string }[] = [
    { v: "free", label: "Free" },
    { v: "under200", label: "Under ₱200" },
    { v: "200to400", label: "₱200–₱400" },
    { v: "over400", label: "Over ₱400" },
  ];
  const sortOptions: { v: SortKey; label: string }[] = [
    { v: "soonest", label: "Soonest" },
    { v: "distance", label: "Nearest" },
    { v: "price_low", label: "Price ↑" },
    { v: "price_high", label: "Price ↓" },
  ];
  const privacyOptions: { v: PrivacyFilter; label: string }[] = [
    { v: "all", label: "All" },
    { v: "public", label: "Public" },
    { v: "private", label: "Private" },
  ];

  function toggleMatch(m: MatchType) {
    onChange({
      ...filters,
      matchTypes: filters.matchTypes.includes(m)
        ? filters.matchTypes.filter((x) => x !== m)
        : [...filters.matchTypes, m],
    });
  }

  function selectSort(v: SortKey) {
    if (v === "distance" && !hasLocation) onUseLocation();
    onChange({ ...filters, sort: v });
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-rondo-elevated border-t border-white/10 shadow-2xl"
        style={{ animation: "rondoSheetUp 280ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div className="sticky top-0 z-10 bg-rondo-elevated/95 backdrop-blur-md flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="font-heading text-white font-black italic text-lg uppercase">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Sort by</SectionLabel>
              <button
                type="button"
                onClick={onUseLocation}
                disabled={locating}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold",
                  hasLocation ? "text-rondo-accent" : "text-white/55 hover:text-white"
                )}
              >
                <MapPin size={12} />
                {locating ? "Locating…" : hasLocation ? "Location on" : "Use my location"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((o) => (
                <OptionChip key={o.v} active={filters.sort === o.v} onClick={() => selectSort(o.v)}>
                  {o.label}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Area</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {FEED_AREAS.map((a) => {
                const active = filters.areas.includes(a.label);
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => toggleArea(a.label)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "bg-rondo-accent text-black border-rondo-accent"
                        : "bg-white/5 text-white/70 border-white/12 hover:border-white/25"
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                    {a.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionLabel>Match type</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {matchTypes.map((m) => (
                <OptionChip key={m} active={filters.matchTypes.includes(m)} onClick={() => toggleMatch(m)}>
                  {m === "futsal" ? "Futsal" : "Football"}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Skill level</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {skillGroups.map((s) => (
                <OptionChip
                  key={s}
                  active={filters.skill === s}
                  onClick={() => onChange({ ...filters, skill: filters.skill === s ? null : s })}
                >
                  {s === "casual" ? "Casual" : s === "intermediate" ? "Intermediate" : "Serious"}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Date</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {dateOptions.map((o) => (
                <OptionChip
                  key={o.v}
                  active={filters.date === o.v}
                  onClick={() => onChange({ ...filters, date: filters.date === o.v ? "any" : o.v })}
                >
                  {o.label}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Time</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((o) => (
                <OptionChip
                  key={o.v}
                  active={filters.time === o.v}
                  onClick={() => onChange({ ...filters, time: filters.time === o.v ? "any" : o.v })}
                >
                  {o.label}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Price</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((o) => (
                <OptionChip
                  key={o.v}
                  active={filters.price === o.v}
                  onClick={() => onChange({ ...filters, price: filters.price === o.v ? "any" : o.v })}
                >
                  {o.label}
                </OptionChip>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Visibility</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {privacyOptions.map((o) => (
                <OptionChip
                  key={o.v}
                  active={filters.privacy === o.v}
                  onClick={() => onChange({ ...filters, privacy: o.v })}
                >
                  {o.label}
                </OptionChip>
              ))}
            </div>
          </section>

        </div>

        <div className="sticky bottom-0 bg-rondo-elevated/95 backdrop-blur-md border-t border-white/8 px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-white/60 hover:text-white text-sm font-semibold px-2"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rondo-btn rondo-btn-primary flex-1"
          >
            Show {resultCount} {resultCount === 1 ? "match" : "matches"}
          </button>
        </div>
      </div>
    </div>
  );
}
