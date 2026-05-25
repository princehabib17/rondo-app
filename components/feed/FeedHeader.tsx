import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

interface FeedHeaderProps {
  notificationCount?: number;
}

export function FeedHeader({ notificationCount = 0 }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <Image src="/rondo-logo.png" alt="RONDO" width={36} height={36} className="object-contain" priority />
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell size={22} strokeWidth={1.75} />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
