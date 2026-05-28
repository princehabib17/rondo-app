"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/feed/map", icon: Map, label: "Map" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/96 backdrop-blur-xl border-t border-white/[0.06] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/feed"
              ? pathname === "/feed"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-all active:scale-90"
            >
              <div
                className={cn(
                  "w-12 h-7 flex items-center justify-center rounded-2xl transition-all duration-200",
                  active ? "bg-rondo-accent/15" : ""
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={cn(
                    "transition-all duration-200",
                    active ? "text-rondo-accent" : "text-white/35"
                  )}
                />
              </div>
              <span
                className={cn(
                  "font-body text-[9px] font-semibold tracking-wide transition-all duration-200 leading-none",
                  active ? "text-rondo-accent" : "text-white/35"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
