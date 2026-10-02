"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChatCircleText,
  CheckCircle,
  Clock,
  Fire,
  Lifebuoy,
  Megaphone,
  Trophy,
  UserPlus,
  Wallet,
  XCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/supabase/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, RondoButton } from "@/components/rondo/primitives";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

function NotificationIcon({ type, unread }: { type: string; unread: boolean }) {
  const props = { size: 18, weight: unread ? ("fill" as const) : ("regular" as const), "aria-hidden": true };
  if (type.startsWith("tournament")) return <Trophy {...props} />;
  if (type.startsWith("ticket")) return <Lifebuoy {...props} />;
  if (type.startsWith("post_liked")) return <Fire {...props} />;
  if (type.startsWith("post_")) return <ChatCircleText {...props} />;
  if (type.startsWith("waitlist") || type === "reservation_expired") return <Clock {...props} />;
  if (type === "payment_success" || type === "refund_issued") return <Wallet {...props} />;
  if (type === "game_cancelled" || type === "removed_from_game") return <XCircle {...props} />;
  if (type === "organizer_broadcast") return <Megaphone {...props} />;
  if (type === "join_requested") return <UserPlus {...props} />;
  if (type === "approval_accepted") return <CheckCircle {...props} />;
  return <Bell {...props} />;
}

function NotificationRow({ item, unread }: { item: AppNotification; unread: boolean }) {
  return (
    <Link
      href={item.link ?? "/feed"}
      className="flex min-h-16 items-start gap-3 px-4 py-3 transition-colors active:bg-[var(--bg-inset)]"
    >
      <span
        className={cn(
          "relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-[var(--r-pill)]",
          unread ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "bg-[var(--bg-inset)] text-[var(--ink-low)]"
        )}
      >
        <NotificationIcon type={item.type} unread={unread} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cn("rondo-body font-bold", unread ? "text-[var(--ink-hi)]" : "text-[var(--ink-mid)]")}>
            {item.title}
          </span>
          <span className="shrink-0 rondo-meta text-[var(--ink-low)]">
            {formatRelativeTime(item.created_at).replace("about ", "")}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block rondo-meta text-[var(--ink-low)]">{item.body}</span>
      </span>
    </Link>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login?next=/notifications");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      setNotifications((data as AppNotification[]) ?? []);
      setLoading(false);
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userData.user.id)
        .is("read_at", null);

      window.dispatchEvent(new Event("notifications-read"));
    }
    load();
  }, [router]);

  // State holds what was fetched before this visit's mark-all-read write, so
  // read_at still says "was this unread when the user opened the page".
  const fresh = notifications.filter((item) => item.read_at == null);
  const earlier = notifications.filter((item) => item.read_at != null);

  return (
    <div className="min-h-[100dvh] rondo-page">
      <PageHeader title="Notifications" back fallbackHref="/feed" />
      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-[var(--r-md)] rondo-shimmer" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="All quiet"
            body="Join a match or a tournament. Kickoff reminders, results, and replies land here."
            action={<RondoButton href="/feed">Find a match</RondoButton>}
            className="py-12"
          />
        ) : (
          [
            { label: "New", items: fresh, unread: true },
            { label: "Earlier", items: earlier, unread: false },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 rondo-label text-[var(--ink-low)]">{group.label}</h2>
                <div className="divide-y divide-[var(--stroke)] overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                  {group.items.map((item) => (
                    <NotificationRow key={item.id} item={item} unread={group.unread} />
                  ))}
                </div>
              </section>
            ))
        )}
      </div>
    </div>
  );
}
