import { RondoPage } from "@/components/rondo/primitives";
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { ThemeToggle } from "@/components/theme-toggle";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <RondoPage className="relative mx-auto flex max-w-sm flex-col justify-center px-6 py-8 rondo-phone-frame">
        <ThemeToggle className="absolute right-4 top-4" />
        <SupabaseConfigMissing title="Sign-in unavailable" />
      </RondoPage>
    );
  }

  return (
    <RondoPage className="relative mx-auto flex max-w-sm flex-col justify-center px-6 py-8 rondo-phone-frame">
      <ThemeToggle className="absolute right-4 top-4" />
      {children}
    </RondoPage>
  );
}
