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
      <header className="sticky top-0 rondo-glass-nav border-b border-[var(--stroke)] z-40 px-4 py-3 max-w-lg mx-auto">
        <h1 className="font-heading text-[var(--ink-hi)] font-black italic text-lg uppercase">Notifications</h1>
      </header>
      <div className="p-4 max-w-lg mx-auto space-y-3">
      {notifications.length === 0 ? (
        <div className="rondo-surface p-6 text-center">
          <p className="text-[var(--ink-mid)] text-sm">No notifications yet.</p>
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
              className={`flex items-start gap-3 rounded-[var(--r-md)] border p-3 transition-[border-color] duration-200 hover:border-[var(--gold)]/25 ${
                unread ? "border-[var(--gold)]/30 bg-[var(--gold)]/[0.06]" : "border-[var(--stroke)] bg-[var(--bg-surface)]"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-[var(--gold)]" : "bg-transparent"}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <p className={`text-sm ${unread ? "font-bold text-[var(--ink-hi)]" : "font-semibold text-[var(--ink-hi)]"}`}>
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-mid)]">{item.body}</p>
              </span>
            </Link>
          );
        })
      )}
      </div>
    </div>
  );
}
