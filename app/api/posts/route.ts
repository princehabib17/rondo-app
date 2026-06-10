import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import { createPostSchema } from "@/lib/social/post-schema";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to post" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = createPostSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const input = parsed.data;
    // RLS enforces author_id = auth.uid().
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: userData.user.id,
        body: input.body,
        kind: input.kind,
        game_id: input.gameId ?? null,
        tournament_id: input.tournamentId ?? null,
        media_url: input.mediaUrl ?? null,
      })
      .select("id")
      .single();

    if (error || !post) {
      return NextResponse.json({ error: error?.message ?? "Could not create post" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Post failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
