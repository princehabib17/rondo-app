"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/my-games", icon: Bookmark, label: "My Games" },
  { href: "/organizer/dashboard", icon: ClipboardList, label: "Organizer" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link 
              key={href} 
              href={href} 
              className="flex flex-col items-center gap-1.5 flex-1 py-3 transition-colors active:scale-95"
            >
              <Icon 
                size={24} 
                className={cn(
                  "transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
