import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { ensurePublishedCity } from "@/lib/seed/ensure-published-city";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="relative mx-auto min-h-[100dvh] max-w-lg rondo-page">
        <SupabaseConfigMissing />
      </div>
    );
  }

  await ensurePublishedCity();

  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
