import Link from "next/link";
import { Fire, Minus, SoccerBall, TrendDown, TrendUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/** Shared page shell. Pitch-black base plus subtle stadium glow. */
export function RondoPage({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rondo-page min-h-[100dvh]", className)}>{children}</div>;
}

type RondoButtonProps = {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
};

export function RondoButton({
  href,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  className,
  children,
}: RondoButtonProps) {
  const classes = cn(
    "rondo-btn",
    variant === "primary" && "rondo-btn-primary",
    variant === "secondary" && "rondo-btn-secondary",
    variant === "ghost" && "rondo-btn-ghost",
    disabled && "opacity-45 pointer-events-none",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function RondoSurface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("rondo-surface", className)}>{children}</div>;
}

export const rondoFieldClass =
  "h-12 w-full max-w-full min-w-0 rounded-[var(--r-sm)] border border-transparent bg-[var(--bg-inset)] px-4 text-[var(--ink-hi)] rondo-body placeholder:text-[var(--ink-low)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--gold)_16%,transparent)] transition-[border-color,box-shadow] duration-200";

type StatTileProps = {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function StatTile({ label, value, unit, trend, size = "md", className }: StatTileProps) {
  const TrendIcon = trend === "up" ? TrendUp : trend === "down" ? TrendDown : trend === "flat" ? Minus : null;

  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4",
        size === "lg" && "p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "font-heading font-bold tabular-nums tracking-[0.005em] text-[var(--ink-hi)]",
              size === "lg" && "text-[2.5rem] leading-[2.5rem]",
              size === "md" && "text-[2rem] leading-8",
              size === "sm" && "text-xl leading-[1.375rem]"
            )}
          >
            {value}
            {unit && <span className="ml-1 text-[0.55em] text-[var(--ink-mid)]">{unit}</span>}
          </p>
          <p className="mt-1 rondo-label text-[var(--ink-low)]">{label}</p>
        </div>
        {TrendIcon && (
          <TrendIcon
            size={16}
            weight="bold"
            className={cn(
              "shrink-0",
              trend === "up" && "text-[var(--ok)]",
              trend === "down" && "text-[var(--live)]",
              trend === "flat" && "text-[var(--ink-low)]"
            )}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

type ChipProps = {
  label: string;
  variant?: "gold" | "outline" | "ghost" | "live";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
};

export function Chip({ label, variant = "ghost", size = "md", className, icon }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-[var(--r-pill)] rondo-label",
        size === "md" ? "h-8 px-3" : "h-6 px-2 text-[0.625rem]",
        variant === "gold" && "bg-[var(--gold)] text-[var(--gold-ink)]",
        variant === "outline" && "border border-[var(--gold)] text-[var(--gold)]",
        variant === "ghost" && "border border-[var(--stroke)] text-[var(--ink-low)]",
        variant === "live" && "bg-[color-mix(in_oklch,var(--live)_16%,transparent)] text-[var(--live)]",
        className
      )}
    >
      {variant === "live" && <span className="rondo-live-dot" aria-hidden />}
      {icon}
      {label}
    </span>
  );
}

type KudosButtonProps = {
  count: number;
  active: boolean;
  onToggle?: () => void;
  className?: string;
};

export function KudosButton({ count, active, onToggle, className }: KudosButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] px-3 rondo-meta font-bold transition-[color,transform,background-color] duration-200 active:scale-[0.97]",
        active
          ? "bg-[var(--gold-dim)] text-[var(--gold)]"
          : "text-[var(--ink-low)] hover:text-[var(--ink-mid)]",
        className
      )}
      aria-pressed={active}
      aria-label={active ? "Remove hype" : "Hype this"}
    >
      <Fire size={20} weight={active ? "fill" : "regular"} aria-hidden />
      <span className="tabular-nums">{count}</span>
      {active && <span className="absolute inset-0 rounded-[var(--r-pill)] ring-1 ring-[var(--gold)]" aria-hidden />}
    </button>
  );
}

type StepHeaderProps = {
  current: number;
  total: number;
  label: string;
  className?: string;
};

export function StepHeader({ current, total, label, className }: StepHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="rondo-label text-[var(--ink-low)]">
        {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h2 className="rondo-title text-[var(--ink-hi)]">{label}</h2>
    </div>
  );
}

type MatchCellProps = {
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoff?: string | null;
  state: "scheduled" | "live" | "final";
  className?: string;
};

export function MatchCell({ home, away, homeScore, awayScore, kickoff, state, className }: MatchCellProps) {
  const hasScore = homeScore != null && awayScore != null;
  const homeWon = state === "final" && hasScore && homeScore > awayScore;
  const awayWon = state === "final" && hasScore && awayScore > homeScore;

  return (
    <div className={cn("grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--stroke)] px-4 py-3 last:border-b-0", className)}>
      <span className={cn("truncate rondo-body", homeWon ? "text-[var(--ink-hi)]" : "text-[var(--ink-mid)]")}>{home}</span>
      <span className="inline-flex min-w-16 items-center justify-center gap-1 rounded-[var(--r-pill)] bg-[var(--bg-inset)] px-3 py-1 font-heading text-xl font-bold tabular-nums text-[var(--gold)]">
        {state === "live" && <span className="rondo-live-dot" aria-hidden />}
        {hasScore ? `${homeScore} - ${awayScore}` : kickoff ?? "vs"}
      </span>
      <span className={cn("truncate text-right rondo-body", awayWon ? "text-[var(--ink-hi)]" : "text-[var(--ink-mid)]")}>{away}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-[var(--r-pill)] border border-[var(--stroke)] bg-[var(--bg-surface)] text-[var(--ink-low)]">
        <SoccerBall size={24} weight="duotone" aria-hidden />
      </div>
      <h3 className="rondo-title text-[var(--ink-hi)]">{title}</h3>
      <p className="mt-2 max-w-xs rondo-meta text-[var(--ink-low)]">{body}</p>
      {action && <div className="mt-4 w-full max-w-xs">{action}</div>}
    </div>
  );
}
