import { createBrowserClient } from "@supabase/ssr";
import { PASSKEY_AUTH_OPTIONS } from "@/lib/auth/passkey-options";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

export function createClient() {
  const { url, anonKey } = requireSupabasePublicConfig();
  return createBrowserClient(url, anonKey, {
    auth: PASSKEY_AUTH_OPTIONS,
  });
}
