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
    <nav className="fixed bottom-0 left-0 right-0 rondo-glass-nav z-[200] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 w-full max-w-[430px] items-center justify-around overflow-hidden px-2">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);
          const pending = pendingHref === href && !active;
          const highlighted = active || pending;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (!active) setPendingHref(href);
              }}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
            >
              {/* Sliding gold dot indicator using shared layout animation */}
              <AnimatePresence>
                {highlighted && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-1.5 h-1 w-5 rounded-full bg-rondo-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={snappy}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={highlighted ? { scale: [1, 0.82, 1.08, 1] } : { scale: 1 }}
                transition={snappy}
                key={highlighted ? "active" : "inactive"}
              >
                <Icon
                  size={25}
                  strokeWidth={highlighted ? 2 : 1.75}
                  className={cn(
                    "transition-colors duration-150",
                    highlighted ? "text-rondo-accent" : "text-white/45"
                  )}
                />
              </motion.div>

              <span
                className={cn(
                  "max-w-full truncate font-body text-[11px] font-medium transition-colors duration-150",
                  highlighted ? "text-rondo-accent" : "text-white/45"
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
