import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)]">
        <SupabaseConfigMissing title="Onboarding unavailable" />
      </div>
    );
  }

  return <div className="min-h-screen bg-[var(--bg-page)]">{children}</div>;
}
