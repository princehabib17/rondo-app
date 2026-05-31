import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Save coarse location for nearest-player discovery (skipped if location_hidden). */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("location_hidden")
      .eq("id", userData.user.id)
      .single();

    if (profile?.location_hidden) {
      return NextResponse.json({ saved: false, reason: "location_hidden" });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        last_lat: parsed.data.lat,
        last_lng: parsed.data.lng,
      })
      .eq("id", userData.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ saved: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save location";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
