"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/supabase/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setNotifications((data as AppNotification[]) ?? []);
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userData.user.id)
        .is("read_at", null);

      window.dispatchEvent(new Event("notifications-read"));
    }
    load();
  }, [router]);

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3 max-w-lg mx-auto">
        <h1 className="font-heading text-white font-black italic text-lg uppercase">Notifications</h1>
      </header>
      <div className="p-4 max-w-lg mx-auto space-y-3">
      {notifications.length === 0 ? (
        <div className="rondo-surface p-6 text-center">
          <p className="text-white/55 text-sm">No notifications yet.</p>
        </div>
      ) : (
        notifications.map((item) => {
          // notifications state holds what was fetched before this visit's
          // mark-all-read write, so read_at here still reflects "was this
          // unread when the user opened the page" — worth keeping visible.
          const unread = item.read_at == null;
          return (
            <Link
              key={item.id}
              href={item.link ?? "/feed"}
              className={`flex items-start gap-3 rounded-[var(--r-md)] border p-3 transition-[border-color] duration-200 hover:border-rondo-accent/25 ${
                unread ? "border-rondo-accent/30 bg-rondo-accent/[0.06]" : "border-border bg-card"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-rondo-accent" : "bg-transparent"}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <p className={`text-sm ${unread ? "font-bold text-white" : "font-semibold text-white/80"}`}>
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-white/70">{item.body}</p>
              </span>
            </Link>
          );
        })
      )}
      </div>
    </div>
  );
}
