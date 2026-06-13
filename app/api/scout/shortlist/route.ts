import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("scout_shortlists")
    .select("*, player:profiles!player_id(id,full_name,avatar_url,nationality,position,skill_level)")
    .eq("scout_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shortlist: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { player_id, note } = await request.json() as { player_id: string; note?: string };
  if (!player_id) return NextResponse.json({ error: "player_id required" }, { status: 400 });

  const existing = await supabase
    .from("scout_shortlists")
    .select("id")
    .eq("scout_id", userData.user.id)
    .eq("player_id", player_id)
    .maybeSingle();

  if (existing.data) {
    await supabase.from("scout_shortlists").delete()
      .eq("scout_id", userData.user.id).eq("player_id", player_id);
    return NextResponse.json({ shortlisted: false });
  }

  const { error } = await supabase
    .from("scout_shortlists")
    .insert({ scout_id: userData.user.id, player_id, note: note ?? null });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shortlisted: true });
}
