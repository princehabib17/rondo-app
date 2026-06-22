"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LayoutDashboard, MapPinned, Radio, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserRole = "player" | "organizer" | null;

type TabDef = {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: (pathname: string) => boolean;
};

const playerTabs: TabDef[] = [
  {
    href: "/feed",
    icon: Home,
    label: "Discover",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/community",
    icon: Users,
    label: "Squad",
    isActive: (p) => p === "/community" || p.startsWith("/community/"),
  },
  {
    href: "/feed/map",
    icon: MapPinned,
    label: "Map",
    isActive: (p) => p === "/feed/map" || p.startsWith("/feed/map/"),
  },
  {
    href: "/my-games",
    icon: CalendarDays,
    label: "Matches",
    isActive: (p) => p === "/my-games" || p.startsWith("/my-games/"),
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
    isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
  },
];

const organizerTabs: TabDef[] = [
  {
    href: "/feed",
    icon: Home,
    label: "Discover",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/organizer/dashboard",
    icon: LayoutDashboard,
    label: "Create",
    isActive: (p) =>
      p === "/organizer/dashboard" ||
      (p.startsWith("/organizer") && !p.startsWith("/organizer/room")),
  },
  {
    href: "/organizer/room",
    icon: Radio,
    label: "Requests",
    isActive: (p) =>
      p === "/organizer/room" || p.startsWith("/organizer/room"),
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
    isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (data?.role) setRole(data.role as UserRole);
    }
    fetchRole();
  }, []);

  const isOrganizerRoute = pathname.startsWith("/organizer");
  const tabs = isOrganizerRoute || role === "organizer" ? organizerTabs : playerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)]">
      <div className="rondo-glass-nav mx-auto flex h-[4.35rem] w-full max-w-[430px] items-center justify-around overflow-hidden rounded-[1.4rem] border border-white/10 px-2">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-all active:scale-95",
                active && "bg-rondo-accent text-black"
              )}
            >
              <Icon
                size={21}
                strokeWidth={active ? 2 : 1.75}
                className={cn(
                  "transition-colors duration-200",
                  active ? "text-black" : "text-white/45"
                )}
              />
              <span
                className={cn(
                  "max-w-full truncate font-body text-[9px] font-black uppercase tracking-[0.04em] transition-colors duration-200",
                  active ? "text-black" : "text-white/45"
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
