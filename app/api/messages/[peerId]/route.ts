import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ peerId: string }> }
) {
  try {
    const { peerId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = userData.user.id;

    const { data: messages, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`
      )
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", peerId)
      .eq("recipient_id", me)
      .is("read_at", null);

    return NextResponse.json({ messages: messages ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load thread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ peerId: string }> }
) {
  try {
    const { peerId } = await params;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: userData.user.id,
        recipient_id: peerId,
        body: parsed.data.body.trim(),
      })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
