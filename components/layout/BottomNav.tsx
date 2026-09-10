"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Broadcast,
  CalendarBlank,
  House,
  MapPin,
  Trophy,
  User,
  UsersThree,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
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
    isActive: (p) =>
      p === "/my-games" ||
      p.startsWith("/my-games/") ||
      p === "/tournaments" ||
      p.startsWith("/tournaments/"),
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
    href: "/organizer/dashboard",
    icon: House,
    label: "Home",
    isActive: (p) =>
      p === "/organizer/dashboard" ||
      (p.startsWith("/organizer") &&
        !p.startsWith("/organizer/room") &&
        !p.startsWith("/organizer/tournaments")),
  },
  {
    href: "/organizer/tournaments",
    icon: Trophy,
    label: "Tournaments",
    isActive: (p) => p.startsWith("/organizer/tournaments"),
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
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScrollY.current || current < 50);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isOrganizerRoute = pathname.startsWith("/organizer");
  const tabs = isOrganizerRoute || role === "organizer" ? organizerTabs : playerTabs;

  return (
    <motion.nav
      animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
      transition={snappy}
      className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex h-[60px] items-center gap-1 rounded-[26px] border border-[var(--stroke)] bg-[color-mix(in_oklch,var(--bg-surface)_92%,transparent)] px-2 shadow-[0_8px_28px_color-mix(in_oklch,var(--ink-hi)_12%,transparent)] backdrop-blur-xl">
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
              className="relative flex h-11 w-[52px] items-center justify-center rounded-[14px]"
            >
              <AnimatePresence>
                {highlighted && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[14px] border border-[color-mix(in_oklch,var(--gold)_28%,var(--stroke))] bg-[var(--gold-dim)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={snappy}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={highlighted ? { scale: [1, 0.84, 1.1, 1] } : { scale: 1 }}
                transition={
                  highlighted
                    ? { duration: 0.35, times: [0, 0.3, 0.65, 1], ease: "easeOut" }
                    : snappy
                }
                key={highlighted ? "active" : "inactive"}
                className="relative z-10"
              >
                <Icon
                  size={22}
                  weight={highlighted ? "fill" : "regular"}
                  className={cn(
                    "transition-colors duration-150",
                    highlighted ? "text-[var(--gold)]" : "text-[var(--ink-low)]"
                  )}
                  aria-hidden
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
