import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // Mobile clients (React Native) authenticate with a Bearer token instead of
  // cookies. When present, forward it so supabase.auth.getUser() validates it.
  let authHeader: string | null = null;
  try {
    const headerStore = await headers();
    authHeader = headerStore.get("authorization");
  } catch {
    // headers() unavailable in some contexts — fall back to cookies only.
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(authHeader
        ? { global: { headers: { Authorization: authHeader } } }
        : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
