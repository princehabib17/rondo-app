"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin gate. This is UX only — every admin capability is enforced by RLS
 * (is_admin() policies), so reaching these pages without the role just
 * renders empty data and failed writes.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      if (profile?.role !== "admin") {
        router.replace("/feed");
        return;
      }
      setAllowed(true);
    }
    check();
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-[100dvh] rondo-page px-4 py-5 space-y-3 max-w-lg mx-auto">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return <>{children}</>;
}
