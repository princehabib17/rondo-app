"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/my-games", icon: Trophy, label: "Matches" },
  { href: "/organizer/dashboard", icon: ClipboardList, label: "Organize" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-2 transition-colors active:scale-95"
            >
              <Icon
                size={22}
                className={cn(
                  "transition-colors",
                  active ? "text-rondo-accent" : "text-white/40"
                )}
              />
              <span
                className={cn(
                  "font-body text-[10px] font-medium transition-colors",
                  active ? "text-rondo-accent" : "text-white/40"
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
