import { redirect } from "next/navigation";
import { isGuestUser } from "@/lib/auth/is-guest";
import { ONBOARDING_START_PATH, getRoleHomePath, isAppRole, type AppRole } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

export async function requireCompletedOnboarding(options: { requiredRole?: AppRole } = {}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user || isGuestUser(user)) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (!isAppRole(role)) {
    redirect(ONBOARDING_START_PATH);
  }

  if (options.requiredRole && role !== options.requiredRole) {
    redirect(getRoleHomePath(role));
  }

  return role;
}
