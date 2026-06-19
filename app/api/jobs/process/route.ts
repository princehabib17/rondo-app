import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processJob } from "@/lib/jobs/queue";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * CRON-triggered worker that claims and processes pending background jobs.
 * Called by Vercel Cron or any scheduler with:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Atomically claim up to 5 pending jobs via DB function.
  const { data: jobs, error: claimError } = await service.rpc(
    "claim_pending_jobs",
    { batch_limit: 5 }
  );

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const results = await Promise.allSettled(
    jobs.map(async (job: { id: string; type: string; payload: unknown; attempts: number; max_attempts: number }) => {
      try {
        await processJob(job);
        await service
          .from("background_jobs")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .eq("id", job.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isLastAttempt = job.attempts >= job.max_attempts;

        if (isLastAttempt) {
          // On final failure, reset the tournament to 'registration' so the
          // organizer can retry the start button.
          if (job.type === "tournament.start") {
            const payload = job.payload as { tournamentId?: string };
            if (payload.tournamentId) {
              await service
                .from("tournaments")
                .update({ status: "registration" })
                .eq("id", payload.tournamentId)
                .eq("status", "generating");
            }
          }
          await service
            .from("background_jobs")
            .update({
              status: "failed",
              error: message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        } else {
          // Back to pending with exponential back-off.
          const backoffSeconds = Math.pow(2, job.attempts) * 10;
          const runAfter = new Date(Date.now() + backoffSeconds * 1000).toISOString();
          await service
            .from("background_jobs")
            .update({
              status: "pending",
              error: message,
              run_after: runAfter,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }
        throw err;
      }
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed: jobs.length, succeeded, failed });
}
