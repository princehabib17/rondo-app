import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

const bodySchema = z.object({
  teamName: z.string().trim().min(2).max(60),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to register a team" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = userData.user.id;
    const service = createServiceClient();

    const { data: tournament, error: tournamentError } = await service
      .from("tournaments")
      .select("id, organizer_id, name, status, max_teams")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Registration is closed" }, { status: 409 });
    }

    // Capacity guard; unique constraints below are the final safety net.
    const { count, error: countError } = await service
      .from("tournament_teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .eq("status", "registered");

    if (countError) {
      return NextResponse.json({ error: "Could not verify capacity" }, { status: 500 });
    }
    if ((count ?? 0) >= tournament.max_teams) {
      return NextResponse.json({ error: "This tournament is full" }, { status: 409 });
    }

    const { data: team, error: insertError } = await service
      .from("tournament_teams")
      .insert({
        tournament_id: tournamentId,
        captain_id: userId,
        name: parsed.data.teamName,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const reason = insertError.message.includes("captain")
          ? "You already registered a team in this tournament"
          : "That team name is taken";
        return NextResponse.json({ error: reason }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { organizer_id, name: tournamentName } = tournament;
    const teamName = parsed.data.teamName;
    after(async () => {
      await service.from("notifications").insert({
        user_id: organizer_id,
        type: "tournament_team_registered",
        title: "New team registered",
        body: `"${teamName}" joined ${tournamentName}`,
        link: `/organizer/tournaments/${tournamentId}/manage`,
      });
    });

    return NextResponse.json({ ok: true, teamId: team?.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
