import { NextResponse } from "next/server";
import { runPlaceholderCity } from "@/lib/seed/run-placeholder-city";
import { DEFAULT_WEEKS_AHEAD } from "@/lib/seed/placeholder-organizers";

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
    }

    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
      return NextResponse.json(
        { error: "Seed endpoint disabled: SEED_SECRET is not configured" },
        { status: 503 }
      );
    }
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${seedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const weeksAhead = typeof body.weeksAhead === "number" ? body.weeksAhead : DEFAULT_WEEKS_AHEAD;
    const result = await runPlaceholderCity({ weeksAhead });

    return NextResponse.json({
      ok: true,
      ...result,
      note: "Recurring listings roll forward. Existing games are kept. Organizer logins use *@organizers.rondo with password OrganizerSeed123! (dev seed only).",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
