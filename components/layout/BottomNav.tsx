"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Users, User, LayoutDashboard, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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
    href: "/feed/map",
    icon: Map,
    label: "Map",
    isActive: (p) => p === "/feed/map" || p.startsWith("/feed/map/"),
  },
  {
    href: "/community",
    icon: Users,
    label: "Community",
    isActive: (p) => p === "/community" || p.startsWith("/community/"),
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
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-[200]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);
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
