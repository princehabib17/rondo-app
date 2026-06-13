import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/redirect-url";

type OAuthProvider = "google" | "facebook";

export async function signInWithOAuthProvider(provider: OAuthProvider, next = "/feed"): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const redirectTo = getAuthCallbackUrl(next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams:
        provider === "google"
          ? { access_type: "offline", prompt: "consent" }
          : undefined,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data?.url) {
    window.location.href = data.url;
    return { ok: true };
  }

  return {
    ok: false,
    error:
      `${provider === "google" ? "Google" : "Facebook"} sign-in is not configured. Enable it in Supabase > Authentication > Providers, or continue as guest.`,
  };
}
