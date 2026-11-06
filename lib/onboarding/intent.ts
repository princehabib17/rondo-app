import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

const KEY = "rondo.join.destination";
function safeDestination(raw: string | null): string {
  const safe = getSafeRedirectPath(raw, "/feed");
  const path = safe.split(/[?#]/, 1)[0];
  return /^\/(login|signup|onboarding)(\/|$)/.test(path) ? "/feed" : safe;
}
/** Keep the requested match separately from the profile draft, which is cleared on save. */
export function rememberJoinDestination(raw: string | null): void {
  if (raw === null) return;
  try { window.sessionStorage.setItem(KEY, safeDestination(raw)); } catch { /* Storage may be disabled. */ }
}
export function getJoinDestination(): string {
  try { return safeDestination(window.sessionStorage.getItem(KEY)); } catch { return "/feed"; }
}
export function clearJoinDestination(): void {
  try { window.sessionStorage.removeItem(KEY); } catch { /* Storage may be disabled. */ }
}
