/**
 * Match kickoffs are venue-local (Metro Manila). Vercel servers run in UTC, so
 * every server-rendered "8:00 PM" game read "12:00 PM" and then flipped on
 * hydration. Node re-reads process.env.TZ at runtime, so pinning it here makes
 * SSR format times the way players see them on their phones.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = process.env.APP_TIMEZONE || "Asia/Manila";
  }
}
