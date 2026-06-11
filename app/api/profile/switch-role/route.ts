import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  role: z.enum(["player", "organizer"]),
});

/**
 * Lets a user switch between player and organizer. Goes through the service
 * client because the protect_profile_role trigger blocks client-side role
 * changes; admin accounts are never switchable from here.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account first" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.role === "admin") {
      return NextResponse.json({ error: "This account's role can't be changed" }, { status: 403 });
    }

    if (profile.role !== parsed.data.role) {
      const { error } = await service
        .from("profiles")
        .update({ role: parsed.data.role })
        .eq("id", userData.user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, role: parsed.data.role });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Switch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
