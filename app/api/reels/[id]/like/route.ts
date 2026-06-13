import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const userId = userData.user.id;
  const { data: existing } = await supabase
    .from("reel_likes")
    .select("reel_id")
    .eq("reel_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("reel_likes").delete().eq("reel_id", id).eq("user_id", userId);
    return NextResponse.json({ liked: false });
  } else {
    await supabase.from("reel_likes").insert({ reel_id: id, user_id: userId });
    return NextResponse.json({ liked: true });
  }
}
