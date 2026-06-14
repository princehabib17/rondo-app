import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";
import { MODERATION_REJECTION_MESSAGE, moderateContent } from "@/lib/social/moderation";
import { createScoutClipSchema } from "@/lib/scout/clip-schema";
import { PUBLIC_PROFILE_SELECT } from "@/lib/supabase/profile-select";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scout_clips")
    .select(
      `*, player:profiles!player_id(${PUBLIC_PROFILE_SELECT}), scout_clip_reactions(user_id, kind)`
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ clips: [], error: error.message }, { status: 200 });
  }

  return NextResponse.json({ clips: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Create an account to upload clips" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = createScoutClipSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid clip details" }, { status: 400 });
    }

    const input = parsed.data;
    if (!moderateContent(input.caption).ok) {
      return NextResponse.json({ error: MODERATION_REJECTION_MESSAGE }, { status: 400 });
    }

    const { data: clip, error } = await supabase
      .from("scout_clips")
      .insert({
        player_id: userData.user.id,
        video_url: input.videoUrl,
        thumbnail_url: input.thumbnailUrl || null,
        caption: input.caption,
        position: input.position || null,
        skill_tags: input.skillTags,
      })
      .select("id")
      .single();

    if (error || !clip) {
      return NextResponse.json({ error: error?.message ?? "Could not publish clip" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, clipId: clip.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not publish clip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
