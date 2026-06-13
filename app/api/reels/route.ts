import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGuestUser } from "@/lib/auth/is-guest";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 30);
    const offset = Number(searchParams.get("offset") ?? "0");

    const supabase = await createClient();
    let query = supabase
      .from("player_reels")
      .select("*, player:profiles!player_id(id,full_name,avatar_url,nationality,position), reel_likes(user_id)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (playerId) query = query.eq("player_id", playerId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reels: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || isGuestUser(userData.user)) {
      return NextResponse.json({ error: "Must be a player to post reels" }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role !== "player") {
      return NextResponse.json({ error: "Only players can post reels" }, { status: 403 });
    }

    const json = await request.json();
    const { video_url, caption, position, skill_level } = json as {
      video_url: string;
      caption?: string;
      position?: string;
      skill_level?: string;
    };

    if (!video_url?.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid video URL" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("player_reels")
      .insert({ player_id: userData.user.id, video_url, caption: caption ?? null, position: position ?? null, skill_level: skill_level ?? null })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reelId: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to create reel" }, { status: 500 });
  }
}
