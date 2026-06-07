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
        notifications.map((item) => (
          <Link
            key={item.id}
            href={item.link ?? "/feed"}
            className="block rondo-surface p-3 hover:border-rondo-accent/25 transition-[border-color] duration-200"
          >
            <p className="text-white text-sm font-semibold">{item.title}</p>
            <p className="text-white/70 text-xs mt-1">{item.body}</p>
          </Link>
        ))
      )}
      </div>
    </div>
  );
}
