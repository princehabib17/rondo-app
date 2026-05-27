"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pushInAppNotification } from "@/lib/notifications";

export default function NewHelpTicketPage() {
  const router = useRouter();
  const [type, setType] = useState("payment_issue");
  const [description, setDescription] = useState("");
  const [refundRequested, setRefundRequested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const { data, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userData.user.id,
        type,
        description,
        refund_requested: refundRequested,
        status: refundRequested ? "refund_pending" : "open",
      })
      .select("id")
      .single();
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await pushInAppNotification({
      userId: userData.user.id,
      type: "ticket_created",
      title: "Help ticket submitted",
      body: "Support received your request and will review it soon.",
      link: `/help/${data.id}`,
    });
    router.push(`/help/${data.id}`);
  }

  return (
    <div className="min-h-[100dvh] p-4 max-w-lg mx-auto">
      <h1 className="text-white font-bold text-xl mb-4">Create Help Ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-card border border-border rounded-xl p-3 text-white">
          <option value="payment_issue">Payment issue</option>
          <option value="refund_request">Refund request</option>
          <option value="game_cancelled">Game cancelled</option>
          <option value="organizer_issue">Organizer issue</option>
          <option value="player_issue">Player issue</option>
          <option value="app_issue">App issue</option>
          <option value="other">Other</option>
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full h-28 bg-card border border-border rounded-xl p-3 text-white" placeholder="Describe the issue..." />
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={refundRequested} onChange={(e) => setRefundRequested(e.target.checked)} />
          This ticket includes a refund request
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={saving || !description.trim()} className="w-full bg-rondo-accent text-black font-black py-3 rounded-xl disabled:opacity-50">
          {saving ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}
