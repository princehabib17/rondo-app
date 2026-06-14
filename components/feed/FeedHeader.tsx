import Image from "next/image";
import Link from "next/link";
import { Bell, Clapperboard } from "lucide-react";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 rondo-glass-nav border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/rondo-logo.png" alt="RONDO" width={32} height={32} className="object-contain" priority />
          <span className="font-heading text-white font-black italic text-sm uppercase tracking-wide">
            Rondo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/scout"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rondo-accent/25 bg-rondo-accent/12 px-3 font-heading text-xs font-black uppercase tracking-wide text-rondo-accent transition-colors duration-200 active:scale-[0.98]"
          >
            <Clapperboard size={16} />
            Scout
          </Link>
          <Link
            href="/notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-200 active:scale-[0.98]"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.75} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
