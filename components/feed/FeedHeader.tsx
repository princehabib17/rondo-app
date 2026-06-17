import Image from "next/image";
import Link from "next/link";
import { Bell, Video } from "lucide-react";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 rondo-glass-nav">
      <div className="flex items-center justify-between px-4 h-[54px] max-w-[430px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/rondo-logo.png"
            alt="RONDO"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
          <span className="font-heading text-white font-black italic text-base uppercase tracking-wide">
            Rondo
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/scout"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rondo-accent/20 bg-rondo-accent/[0.08] px-3 font-heading text-[11px] font-black uppercase tracking-wide text-rondo-accent transition-all duration-200 active:scale-[0.96] hover:bg-rondo-accent/[0.14]"
          >
            <Video size={13} strokeWidth={2} />
            Scout
          </Link>
          <Link
            href="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.92]"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.75} />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
