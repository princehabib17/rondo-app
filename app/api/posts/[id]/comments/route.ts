import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";
import { createCommentSchema } from "@/lib/social/post-schema";
import { MODERATION_REJECTION_MESSAGE, moderateContent } from "@/lib/social/moderation";
import { COMMENT_LIMIT, isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/social/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to comment" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = createCommentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!moderateContent(parsed.data.body).ok) {
      return NextResponse.json({ error: MODERATION_REJECTION_MESSAGE }, { status: 400 });
    }

    const userId = userData.user.id;

    if (await isRateLimited(createServiceClient(), "post_comments", userId, COMMENT_LIMIT)) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const { data: post } = await supabase
      .from("posts")
      .select("id, author_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // RLS enforces author_id = auth.uid().
    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: userId, body: parsed.data.body })
      .select("id")
      .single();

    if (error || !comment) {
      return NextResponse.json({ error: error?.message ?? "Could not comment" }, { status: 500 });
    }

    if (post.author_id !== userId) {
      const commentBody = parsed.data.body;
      after(async () => {
        const { data: actor } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        const service = createServiceClient();
        await service.from("notifications").insert({
          user_id: post.author_id,
          type: "post_commented",
          title: "New comment on your post",
          body: `${actor?.full_name ?? "Someone"}: ${commentBody.slice(0, 80)}`,
          link: "/community",
        });
      });
    }

    return NextResponse.json({ ok: true, commentId: comment.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Comment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
