import { createClient } from "@/lib/supabase/client";

/** Avoid hanging auth screens when Supabase DNS/network is down. */
export async function getUserWithTimeout(ms = 4000) {
  const supabase = createClient();
  const result = await Promise.race([
    supabase.auth.getUser(),
    new Promise<{ data: { user: null }; error: { message: string } }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            data: { user: null },
            error: { message: "Auth service is unreachable right now." },
          }),
        ms
      )
    ),
  ]);
  return result;
}
