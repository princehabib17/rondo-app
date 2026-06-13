import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
});

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("organization_members")
    .select("organization_id, role, status, organization:organizations(id,name,slug,logo_url,verified,created_by)")
    .eq("user_id", userData.user.id)
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memberships: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid organization" }, { status: 400 });
  }

  const service = createServiceClient();
  const slug = slugify(parsed.data.name);
  const { data: existing } = await service
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    const { data: member } = await service
      .from("organization_members")
      .select("status")
      .eq("organization_id", existing.id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    return NextResponse.json(
      {
        error: member
          ? `You already have a ${member.status} access record for ${existing.name}.`
          : `${existing.name} already exists. Request access instead.`,
        organizationId: existing.id,
      },
      { status: 409 }
    );
  }

  const { data: organization, error } = await service
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug,
      logo_url: parsed.data.logoUrl || null,
      created_by: userData.user.id,
    })
    .select("id, name, slug, logo_url, verified, created_by")
    .single();

  if (error || !organization) {
    return NextResponse.json({ error: error?.message ?? "Could not create organization" }, { status: 500 });
  }

  await service.from("profiles").update({ role: "organizer" }).eq("id", userData.user.id);

  return NextResponse.json({ organization });
}
