"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  MapPinned,
  Radio,
  User,
  Users,
} from "lucide-react";
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
    label: "Home",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/community",
    icon: Users,
    label: "Community",
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
    label: "Feed",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/organizer/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    isActive: (p) =>
      p === "/organizer/dashboard" ||
      (p.startsWith("/organizer") && !p.startsWith("/organizer/room")),
  },
  {
    href: "/organizer/room",
    icon: Radio,
    label: "Room",
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
    <nav className="fixed bottom-0 left-0 right-0 rondo-glass-nav z-[200] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[60px] w-full max-w-[430px] items-center justify-around px-1">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center gap-[3px] py-2 transition-all active:scale-[0.88]"
            >
              {/* Active pill behind icon */}
              <div className={cn(
                "relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200",
                active
                  ? "bg-rondo-accent/[0.14]"
                  : "bg-transparent"
              )}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.25 : 1.6}
                  className={cn(
                    "transition-all duration-200",
                    active ? "text-rondo-accent" : "text-white/40"
                  )}
                />
                {/* Glow dot for active */}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rondo-accent" />
                )}
              </div>
              <span
                className={cn(
                  "max-w-full truncate font-body text-[10px] transition-all duration-200",
                  active ? "text-rondo-accent font-semibold" : "text-white/35 font-medium"
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
