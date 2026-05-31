import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { notifyWaitlistSpotOpen } from "@/lib/match/waitlist";

const bodySchema = z.object({
  gameId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: game } = await service
      .from("games")
      .select("id, organizer_id, title")
      .eq("id", parsed.data.gameId)
      .single();

    if (!game || game.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notifyWaitlistSpotOpen(game.id, game.title);
    return NextResponse.json({ status: "notified" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Notify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

