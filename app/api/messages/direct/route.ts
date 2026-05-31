import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.is_anonymous) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("direct_messages")
      .select(
        "id, sender_id, recipient_id, body, read_at, created_at, sender:profiles!sender_id(id, full_name, avatar_url, nationality), recipient:profiles!recipient_id(id, full_name, avatar_url, nationality)"
      )
      .or(`sender_id.eq.${userData.user.id},recipient_id.eq.${userData.user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    type Row = {
      id: string;
      sender_id: string;
      recipient_id: string;
      body: string;
      read_at: string | null;
      created_at: string;
      sender: { id: string; full_name: string | null; avatar_url: string | null; nationality: string | null } | null;
      recipient: { id: string; full_name: string | null; avatar_url: string | null; nationality: string | null } | null;
    };

    const byPeer = new Map<
      string,
      {
        peerId: string;
        peer: Row["sender"];
        lastBody: string;
        lastAt: string;
        unread: number;
      }
    >();

    for (const row of ((rows as unknown) as Row[]) ?? []) {
      const peerId = row.sender_id === userData.user.id ? row.recipient_id : row.sender_id;
      const peer = row.sender_id === userData.user.id ? row.recipient : row.sender;
      if (byPeer.has(peerId)) continue;
      const unread =
        ((rows as unknown) as Row[])?.filter(
          (m) => m.sender_id === peerId && m.recipient_id === userData.user!.id && !m.read_at
        ).length ?? 0;
      byPeer.set(peerId, {
        peerId,
        peer,
        lastBody: row.body,
        lastAt: row.created_at,
        unread,
      });
    }

    return NextResponse.json({ conversations: Array.from(byPeer.values()) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const { recipientId, body } = parsed.data;
    if (recipientId === userData.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: userData.user.id,
        recipient_id: recipientId,
        body: body.trim(),
      })
      .select("id, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data.id, created_at: data.created_at });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
