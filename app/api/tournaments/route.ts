import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  format: z.enum(["single_elimination", "round_robin"]),
  startsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  venueName: z.string().trim().min(2).max(120).optional(),
  venueAddress: z.string().trim().max(240).optional(),
  maxTeams: z.coerce.number().int().min(2).max(64),
  teamSize: z.coerce.number().int().min(1).max(11),
  entryFee: z.coerce.number().int().min(0), // centavos per team
});

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role !== "organizer") {
      return NextResponse.json({ error: "Only organizers can create tournaments" }, { status: 403 });
    }

    const input = parsed.data;
    // RLS also enforces organizer_id = auth.uid() and role = organizer.
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .insert({
        organizer_id: userData.user.id,
        name: input.name,
        description: input.description ?? null,
        format: input.format,
        starts_at: new Date(input.startsAt).toISOString(),
        venue_name: input.venueName ?? null,
        venue_address: input.venueAddress ?? null,
        max_teams: input.maxTeams,
        team_size: input.teamSize,
        entry_fee: input.entryFee,
      })
      .select("id")
      .single();

    if (error || !tournament) {
      return NextResponse.json({ error: error?.message ?? "Could not create tournament" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tournamentId: tournament.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
