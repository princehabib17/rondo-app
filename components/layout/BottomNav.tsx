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
    <nav className="fixed bottom-0 left-0 right-0 rondo-glass-nav z-50 pb-[env(safe-area-inset-bottom)]">
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
              className="rondo-nav-pill"
              data-active={active ? "true" : "false"}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.75}
                className={cn(
                  "transition-colors duration-200",
                  active ? "text-rondo-accent" : "text-white/45"
                )}
              />
              <span
                className={cn(
                  "font-body text-[10px] font-semibold transition-colors duration-200",
                  active ? "text-rondo-accent" : "text-white/45"
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
