import { createClient } from "@/lib/supabase/client";

export async function signInAsScout(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { is_scout: true } },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Scout sign-in failed" };
  }
  // Best-effort profile row (same pattern as guest)
  await fetch("/api/auth/guest/ensure-profile", { method: "POST" }).catch(() => null);
  return { ok: true };
}
