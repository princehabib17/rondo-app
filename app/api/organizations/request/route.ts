import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const requestSchema = z.object({
  organizationId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid organization" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: organization } = await service
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .maybeSingle();

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { error } = await service.from("organization_members").upsert({
    organization_id: parsed.data.organizationId,
    user_id: userData.user.id,
    role: "manager",
    status: "requested",
    requested_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
