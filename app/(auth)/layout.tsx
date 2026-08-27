import { RondoPage } from "@/components/rondo/primitives";
import { SupabaseConfigMissing } from "@/components/system/SupabaseConfigMissing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <RondoPage className="mx-auto flex max-w-sm flex-col justify-center px-6 py-8 rondo-phone-frame">
        <SupabaseConfigMissing title="Sign-in unavailable" />
      </RondoPage>
    );
  }

  return (
    <RondoPage className="mx-auto flex max-w-sm flex-col justify-center px-6 py-8 rondo-phone-frame">
      {children}
    </RondoPage>
  );
}
