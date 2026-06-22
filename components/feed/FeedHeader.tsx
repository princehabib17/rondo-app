import Image from "next/image";
import Link from "next/link";
import { Bell, SlidersHorizontal } from "lucide-react";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070807]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/rondo-logo.png" alt="RONDO" width={30} height={30} className="object-contain" priority />
          <div>
            <span className="block font-heading text-white font-black italic text-lg uppercase leading-none tracking-wide">
              Rondo
            </span>
            <span className="block text-[8px] font-black uppercase tracking-[0.22em] text-rondo-accent">
              Find your next five
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/feed/map"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.055] px-3 font-heading text-xs font-black uppercase tracking-wide text-white transition-colors duration-200 active:scale-[0.98]"
          >
            <SlidersHorizontal size={15} />
            Filter
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
