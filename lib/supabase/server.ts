import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { PASSKEY_AUTH_OPTIONS } from "@/lib/auth/passkey-options";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicConfig();

  // Mobile clients (React Native) authenticate with a Bearer token instead of
  // cookies. When present, forward it so supabase.auth.getUser() validates it.
  let authHeader: string | null = null;
  try {
    const headerStore = await headers();
    authHeader = headerStore.get("authorization");
  } catch {
    // headers() unavailable in some contexts — fall back to cookies only.
  }

  return createServerClient(url, anonKey, {
    ...(authHeader ? { global: { headers: { Authorization: authHeader } } } : {}),
    auth: PASSKEY_AUTH_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}
