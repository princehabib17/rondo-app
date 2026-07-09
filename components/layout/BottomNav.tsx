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
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="flex items-center gap-1 px-2 h-[60px] rounded-[22px]"
        style={{
          background: "rgba(12, 12, 12, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
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
              className="relative flex items-center justify-center w-[52px] h-[44px] rounded-[14px]"
            >
              {/* Sliding pill background */}
              <AnimatePresence>
                {highlighted && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background:
                        "color-mix(in oklch, oklch(92% 0.16 102) 11%, transparent)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={snappy}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={
                  highlighted ? { scale: [1, 0.84, 1.1, 1] } : { scale: 1 }
                }
                transition={
                  highlighted
                    ? { type: "tween", duration: 0.28, ease: "easeOut" }
                    : snappy
                }
                key={highlighted ? "active" : "inactive"}
                className="relative z-10"
              >
                <Icon
                  size={22}
                  strokeWidth={highlighted ? 2.1 : 1.65}
                  className={cn(
                    "transition-colors duration-150",
                    highlighted ? "text-rondo-accent" : "text-white/40"
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
