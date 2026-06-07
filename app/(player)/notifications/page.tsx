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
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto space-y-3">
      <h1 className="text-white font-bold text-xl">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-white/60 text-sm">No notifications yet.</p>
      ) : (
        notifications.map((item) => (
          <Link
            key={item.id}
            href={item.link ?? "/feed"}
            className="block bg-card border border-border rounded-xl p-3"
          >
            <p className="text-white text-sm font-semibold">{item.title}</p>
            <p className="text-white/70 text-xs mt-1">{item.body}</p>
          </Link>
        ))
      )}
    </div>
  );
}
