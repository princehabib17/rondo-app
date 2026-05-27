"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToMessages } from "@/lib/realtime";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Message, Profile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface MessageWithProfile extends Omit<Message, "profile"> {
  profile: Profile | null;
}

function MessageSkeleton({ align }: { align: "left" | "right" }) {
  return (
    <div className={cn("flex items-end gap-2", align === "right" && "flex-row-reverse")}>
      <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse shrink-0" />
      <div className={cn("space-y-1", align === "right" && "items-end flex flex-col")}>
        <div className="h-10 w-44 rounded-2xl bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
      setIsGuest(Boolean(userData.user?.is_anonymous));

      // Fetch game info
      const { data: game } = await supabase
        .from("games")
        .select("title, game_players(user_id)")
        .eq("id", id)
        .single();

      if (game) {
        setGameTitle(game.title);
        setPlayerCount((game.game_players as { user_id: string }[]).length);
      }

      // Fetch messages with profiles
      const { data: msgs } = await supabase
        .from("messages")
        .select("*, profile:profiles!user_id(id, full_name, avatar_url, nationality, email, role, bio, position, preferred_foot, created_at, updated_at)")
        .eq("game_id", id)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs as MessageWithProfile[]);
      setLoading(false);
    }
    load();
  }, [id]);

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading) scrollToBottom("instant" as ScrollBehavior);
  }, [loading, scrollToBottom]);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(id, async (rawMsg) => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", rawMsg.user_id)
        .single();

      const msg: MessageWithProfile = { ...rawMsg, profile: profile ?? null };
      setMessages((prev) => [...prev, msg]);
    });
    return () => { unsubscribe(); };
  }, [id]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage() {
    const body = input.trim();
    if (!body || sending || !currentUserId || isGuest) return;
    setSending(true);
    setInput("");
    inputRef.current?.focus();

    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      game_id: id,
      user_id: currentUserId,
      body,
    });
    if (error) {
      setInput(body);
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group consecutive messages from same sender
  type Group = { senderId: string; profile: Profile | null; msgs: MessageWithProfile[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.user_id) {
      last.msgs.push(msg);
    } else {
      groups.push({ senderId: msg.user_id, profile: msg.profile ?? null, msgs: [msg] });
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer active:scale-[0.95]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm truncate">{gameTitle || "Game Chat"}</h1>
          <p className="text-muted-foreground text-xs">{playerCount} players</p>
        </div>
        <div className="flex items-center gap-1.5 bg-rondo-yellow/10 border border-rondo-yellow/20 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-rondo-yellow text-xs font-semibold">Live</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="space-y-4">
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="left" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <MessageCircle size={24} className="text-muted-foreground" />
            </div>
            <p className="text-white font-semibold text-sm">No messages yet</p>
            <p className="text-muted-foreground text-xs text-center max-w-[220px]">
              Be the first to say something to your squad.
            </p>
          </div>
        ) : (
          groups.map((group, gi) => {
            const isOwn = group.senderId === currentUserId;
            const lastMsg = group.msgs[group.msgs.length - 1];
            return (
              <div key={gi} className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
                {/* Avatar — shown once per group */}
                <div className="shrink-0 self-end">
                  {group.profile ? (
                    <PlayerAvatar profile={group.profile} size="xs" showFlag={false} linkable />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                      ?
                    </div>
                  )}
                </div>

                {/* Bubble stack */}
                <div className={cn("flex flex-col gap-1 max-w-[72%]", isOwn && "items-end")}>
                  {/* Sender name */}
                  {!isOwn && (
                    <span className="text-muted-foreground text-[10px] font-medium px-1">
                      {group.profile?.full_name ?? "Player"}
                    </span>
                  )}

                  {group.msgs.map((msg, mi) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "px-3.5 py-2 text-sm leading-relaxed break-words",
                        isOwn
                          ? "bg-rondo-yellow text-rondo-black font-medium rounded-2xl rounded-br-sm"
                          : "bg-zinc-800 text-white rounded-2xl rounded-bl-sm",
                        mi === 0 && isOwn && "rounded-tr-2xl",
                        mi === 0 && !isOwn && "rounded-tl-2xl"
                      )}
                    >
                      {msg.body}
                    </div>
                  ))}

                  {/* Timestamp under last bubble */}
                  <span className="text-muted-foreground text-[10px] px-1">
                    {formatRelativeTime(lastMsg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — sits above bottom nav */}
      <div className="sticky bottom-16 left-0 right-0 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 px-4 py-3 flex items-end gap-3 shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Say something..."
          className="flex-1 resize-none bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-rondo-yellow/40 transition-colors max-h-24 leading-relaxed min-h-[44px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending || isGuest}
          aria-label="Send message"
          className="min-w-[44px] min-h-[44px] rounded-full bg-rondo-yellow flex items-center justify-center active:scale-[0.92] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:brightness-95 shrink-0"
        >
          <ArrowUp size={18} className="text-rondo-black" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
