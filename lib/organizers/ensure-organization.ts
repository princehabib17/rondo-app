import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * First-time organizers shouldn't hit "create an organization first" at the
 * bottom of a filled-in form. If none is picked, reuse an active membership,
 * or create one under the organizer's own name.
 */
export async function ensureOrganizationId(
  supabase: SupabaseClient,
  userId: string,
  pickedId: string
): Promise<{ id: string; created: boolean } | { error: string }> {
  if (pickedId) return { id: pickedId, created: false };

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);
  const existing = (memberships as { organization_id: string }[] | null)?.[0]?.organization_id;
  if (existing) return { id: existing, created: false };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const baseName = (profile?.full_name as string | null)?.trim() || "My games";

  for (const name of [baseName, `${baseName} Football`, `${baseName} ${Math.floor(Date.now() / 1000) % 1000}`]) {
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = (await res.json().catch(() => ({}))) as { organization?: { id: string }; error?: string };
    if (res.ok && json.organization?.id) return { id: json.organization.id, created: true };
    if (res.status !== 409) return { error: json.error ?? "Couldn't set up your organizer name. Try again." };
  }
  return { error: "Pick a name for your organization above, then publish." };
}
