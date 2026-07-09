import Image from "next/image";
import Link from "next/link";
import { Bell, VideoCamera } from "@phosphor-icons/react";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--stroke)] rondo-glass-nav">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Image src="/rondo-logo.png" alt="RONDO" width={32} height={32} className="object-contain" priority />
          <div>
            <span className="block font-heading text-sm font-black uppercase tracking-wide text-[var(--ink-hi)]">
              Rondo
            </span>
            <span className="rondo-meta -mt-0.5 block text-[var(--ink-low)]">Street feed</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/scout"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--r-pill)] border border-[color-mix(in_oklch,var(--gold)_34%,transparent)] bg-[var(--gold-dim)] px-3 font-heading text-xs font-black uppercase tracking-wide text-[var(--gold)] transition-colors duration-200 active:scale-[0.98]"
          >
            <VideoCamera size={16} weight="duotone" />
            Scout
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)] transition-colors duration-200 hover:bg-[var(--bg-inset)] hover:text-[var(--ink-hi)] active:scale-[0.98]"
            aria-label="Notifications"
          >
            <Bell size={20} weight="duotone" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--live)] px-1 text-[10px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
