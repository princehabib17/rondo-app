import { signInAsGuest } from "@/lib/auth/guest";

export async function signInAsScout(): Promise<{ ok: boolean; error?: string }> {
  const guest = await signInAsGuest();
  if (!guest.ok) {
    return guest;
  }
  return { ok: true };
}
