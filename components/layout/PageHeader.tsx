"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** `true` goes back in history (falling back to `fallbackHref`); a string links there. */
  back?: boolean | string;
  fallbackHref?: string;
  trailing?: React.ReactNode;
  /** Rendered under the title row, inside the sticky bar (tabs, filters). */
  children?: React.ReactNode;
  className?: string;
};

const backClass =
  "-ml-2 grid size-11 shrink-0 place-items-center rounded-[var(--r-pill)] text-[var(--ink-hi)] transition-colors duration-150 hover:bg-[var(--bg-inset)] active:scale-[0.96]";

/** The one sticky screen header: back, title, optional trailing action. */
export function PageHeader({
  title,
  subtitle,
  back,
  fallbackHref = "/feed",
  trailing,
  children,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav pt-[env(safe-area-inset-top)]",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
        {typeof back === "string" ? (
          <Link href={back} className={backClass} aria-label="Back">
            <ArrowLeft size={20} weight="bold" aria-hidden />
          </Link>
        ) : back ? (
          <button
            type="button"
            className={backClass}
            aria-label="Back"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(fallbackHref);
            }}
          >
            <ArrowLeft size={20} weight="bold" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate">{title}</h1>
          {subtitle && <p className="truncate rondo-meta text-[var(--ink-low)]">{subtitle}</p>}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
      </div>
      {children && <div className="mx-auto max-w-lg px-4 pb-3">{children}</div>}
    </header>
  );
}
