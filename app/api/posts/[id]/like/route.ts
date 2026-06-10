import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isGuestUser } from "@/lib/auth/is-guest";

/** Toggles the caller's like on a post. Returns the new liked state. */
export async function POST(
  _request: Request,
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
      return NextResponse.json({ error: "Create an account to like posts" }, { status: 403 });
    }

    const userId = userData.user.id;
    const { data: post } = await supabase
      .from("posts")
      .select("id, author_id, body")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // RLS enforces user_id = auth.uid() on both insert and delete.
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      if (insertError.code === "23505") {
        // Already liked — toggle off.
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        return NextResponse.json({ ok: true, liked: false });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (post.author_id !== userId) {
      const { data: actor } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      const service = createServiceClient();
      await service.from("notifications").insert({
        user_id: post.author_id,
        type: "post_liked",
        title: "Your post got a like",
        body: `${actor?.full_name ?? "Someone"} liked your post`,
        link: "/community",
      });
    }

    return NextResponse.json({ ok: true, liked: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Like failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
