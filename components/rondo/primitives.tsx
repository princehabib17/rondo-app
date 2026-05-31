import Link from "next/link";
import { cn } from "@/lib/utils";

/** Shared page shell — pitch-black base + subtle stadium glow */
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
  "w-full bg-rondo-elevated border border-white/12 text-white px-4 py-3.5 text-sm rounded-xl placeholder:text-white/30 focus:outline-none focus:border-rondo-accent/60 focus:ring-2 focus:ring-rondo-accent/15 transition-[border-color,box-shadow] duration-200";
