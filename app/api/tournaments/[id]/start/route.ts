import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { enqueueJob } from "@/lib/jobs/queue";

/**
 * Closes registration and enqueues fixture generation as a background job.
 * Returns 202 immediately; the bracket appears via realtime once the job runs.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: tournament } = await service
      .from("tournaments")
      .select("id, organizer_id, status, format, name")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.organizer_id !== userData.user.id) {
      return NextResponse.json({ error: "Only the organizer can start this tournament" }, { status: 403 });
    }
    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Tournament has already started" }, { status: 409 });
    }

    const { count } = await service
      .from("tournament_teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .eq("status", "registered");

    if ((count ?? 0) < 2) {
      return NextResponse.json({ error: "Need at least 2 registered teams" }, { status: 409 });
    }

    // Mark as generating to prevent double-starts and update the UI immediately.
    await service
      .from("tournaments")
      .update({ status: "generating" })
      .eq("id", tournamentId);

    const jobId = await enqueueJob("tournament.start", { tournamentId });

    return NextResponse.json({ queued: true, jobId }, { status: 202 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Start failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
