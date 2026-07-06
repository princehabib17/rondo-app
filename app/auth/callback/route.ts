import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.is_anonymous) {
        return NextResponse.redirect(`${origin}/feed`);
      }

      if (user) {
        // Password reset flow — always follow next
        if (next.startsWith("/reset-password")) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        // Check whether the user has completed onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const destination = profile?.role ? next : "/onboarding/slides";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
