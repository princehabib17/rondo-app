import { createBrowserClient } from "@supabase/ssr";
import { PASSKEY_AUTH_OPTIONS } from "@/lib/auth/passkey-options";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: PASSKEY_AUTH_OPTIONS,
    }
  );
}
