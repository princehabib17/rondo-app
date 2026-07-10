"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarBlank,
  House,
  SquaresFour,
  MapPin,
  Broadcast,
  User,
  UsersThree,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { snappy } from "@/components/motion/springs";

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
    icon: House,
    label: "Home",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/community",
    icon: UsersThree,
    label: "Community",
    isActive: (p) => p === "/community" || p.startsWith("/community/"),
  },
  {
    href: "/feed/map",
    icon: MapPin,
    label: "Map",
    isActive: (p) => p === "/feed/map" || p.startsWith("/feed/map/"),
  },
  {
    href: "/my-games",
    icon: CalendarBlank,
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
    icon: House,
    label: "Feed",
    isActive: (p) => p === "/feed",
  },
  {
    href: "/organizer/dashboard",
    icon: SquaresFour,
    label: "Dashboard",
    isActive: (p) =>
      p === "/organizer/dashboard" ||
      (p.startsWith("/organizer") && !p.startsWith("/organizer/room")),
  },
  {
    href: "/organizer/room",
    icon: Broadcast,
    label: "Room",
    isActive: (p) => p === "/organizer/room" || p.startsWith("/organizer/room"),
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);

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

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isOrganizerRoute = pathname.startsWith("/organizer");
  const tabs = isOrganizerRoute || role === "organizer" ? organizerTabs : playerTabs;

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-[200] -translate-x-1/2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="rondo-glass-nav flex h-[60px] items-center gap-1 rounded-[var(--r-lg)] border border-[var(--stroke)] px-2 shadow-[0_8px_40px_color-mix(in_oklch,var(--bg-page)_65%,transparent)]">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);
          const pending = pendingHref === href && !active;
          const highlighted = active || pending;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              onClick={() => {
                if (!active) setPendingHref(href);
              }}
              className="relative flex h-11 w-[52px] items-center justify-center rounded-[var(--r-md)]"
            >
              <AnimatePresence>
                {highlighted && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[var(--r-md)] bg-[var(--gold-dim)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={snappy}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={highlighted ? { scale: [1, 0.84, 1.1, 1] } : { scale: 1 }}
                transition={snappy}
                key={highlighted ? "active" : "inactive"}
                className="relative z-10"
              >
                <Icon
                  size={22}
                  weight={highlighted ? "fill" : "duotone"}
                  className={cn(
                    "transition-colors duration-150",
                    highlighted ? "text-[var(--gold)]" : "text-[var(--ink-low)]"
                  )}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
