"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy squad chat — redirects to organizer room (read-only announcements). */
export default function LegacyChatRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/games/${id}/room`);
  }, [id, router]);

  return (
    <div className="min-h-[100dvh] rondo-page flex items-center justify-center">
      <p className="text-white/50 text-sm">Opening organizer room…</p>
    </div>
  );
}
