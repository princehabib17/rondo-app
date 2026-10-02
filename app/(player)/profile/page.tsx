"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export default function MyProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setUserId(data.user.id);
        else router.replace("/login?next=/profile");
      });
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-[100dvh] rondo-page space-y-4 px-4 pt-20">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="h-56 rounded-[var(--r-lg)] rondo-shimmer" />
          <div className="h-28 rounded-[var(--r-md)] rondo-shimmer" />
        </div>
      </div>
    );
  }

  return <ProfileScreen id={userId} asTab />;
}
