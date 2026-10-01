/** True when the request is carrying a Supabase session cookie (including chunked tokens). */
export function hasSupabaseAuthCookie(cookieNames: readonly string[]): boolean {
  return cookieNames.some(
    (name) =>
      name.startsWith("sb-") &&
      name.includes("-auth-token") &&
      !name.includes("code-verifier")
  );
}
