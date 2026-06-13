import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const updateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "manager"]).default("manager"),
  status: z.enum(["active", "rejected"]).default("active"),
});

async function canApprove(service: ReturnType<typeof createServiceClient>, organizationId: string, userId: string) {
  const { data } = await service
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.status === "active" && (data.role === "owner" || data.role === "admin");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!(await canApprove(service, id, userData.user.id))) {
    return NextResponse.json({ error: "No organization admin access" }, { status: 403 });
  }

  const { data, error } = await service
    .from("organization_members")
    .select("organization_id, user_id, role, status, requested_at, approved_at, profile:profiles(id,full_name,avatar_url,phone,email)")
    .eq("organization_id", id)
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!(await canApprove(service, id, userData.user.id))) {
    return NextResponse.json({ error: "No organization admin access" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid member update" }, { status: 400 });
  }

  const { error } = await service
    .from("organization_members")
    .update({
      role: parsed.data.role,
      status: parsed.data.status,
      approved_at: parsed.data.status === "active" ? new Date().toISOString() : null,
    })
    .eq("organization_id", id)
    .eq("user_id", parsed.data.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
