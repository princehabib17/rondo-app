import Link from "next/link";
import { Bell, VideoCamera } from "@phosphor-icons/react";
import { RondoBrand } from "@/components/brand/RondoBrand";
import { ThemeToggle } from "@/components/theme-toggle";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <RondoBrand kind="wordmark" surface="auto" className="h-7 w-28 shrink-0 min-[360px]:h-8 min-[360px]:w-32" fetchPriority="high" />
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href="/scout"
            aria-label="Scout clips"
            className="inline-flex h-10 min-w-10 justify-center items-center gap-1.5 rounded-[var(--r-pill)] border border-[var(--stroke)] px-3 rondo-label text-[var(--ink-hi)] transition-colors duration-200 hover:bg-[var(--bg-inset)] active:scale-[0.98]"
          >
            <VideoCamera size={16} weight="bold" aria-hidden />
            <span className="hidden min-[360px]:inline">Scout</span>
          </Link>
          <ThemeToggle />
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)] transition-colors duration-200 hover:bg-[var(--bg-inset)] hover:text-[var(--ink-hi)] active:scale-[0.98]"
            aria-label="Notifications"
          >
            <Bell size={20} weight="duotone" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-[var(--r-pill)] bg-[var(--live)] px-1 text-[0.625rem] font-bold tabular-nums text-[var(--night-ink)]">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
