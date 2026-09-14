import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="relative mx-auto min-h-[100dvh] max-w-lg rondo-page">
        <SupabaseConfigMissing />
      </div>
    );
  }

  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
