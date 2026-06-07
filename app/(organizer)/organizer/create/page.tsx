"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Colors also defined as CSS variables in globals.css under --color-team-*
const TEAM_COLORS = [
  { name: "Red", color: "#E53935" },
  { name: "Blue", color: "#1E88E5" },
  { name: "Yellow", color: "#F5E642" },
  { name: "Green", color: "#43A047" },
  { name: "Orange", color: "#FB8C00" },
  { name: "Purple", color: "#8E24AA" },
];

const createGameSchema = z.object({
  title: z.string().min(3, "Title required"),
  venue_name: z.string().min(2, "Venue name required"),
  venue_address: z.string().min(5, "Address required"),
  date_time: z.string().min(1, "Date and time required"),
  price_per_player: z.coerce.number().min(0),
  max_players: z.coerce.number().min(2).max(100),
  num_teams: z.coerce.number().min(2).max(8),
  format: z.string().min(1),
  round_duration_minutes: z.coerce.number().min(1).max(60),
  payment_type: z.enum(["online", "venue"]),
  description: z.string().optional(),
});
type CreateGameForm = z.infer<typeof createGameSchema>;

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ph`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export default function CreateGamePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CreateGameForm>({
    resolver: zodResolver(createGameSchema) as any,
    defaultValues: {
      format: "5v5",
      round_duration_minutes: 8,
      payment_type: "online",
      max_players: 10,
      num_teams: 2,
      price_per_player: 200,
    },
  });

  const numTeams = watch("num_teams") || 2;

  async function onSubmit(data: CreateGameForm) {
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    // Geocode if we don't have coords yet
    let finalCoords = coords;
    if (!finalCoords) {
      finalCoords = await geocodeAddress(`${data.venue_name}, ${data.venue_address}`);
    }

    const { data: game, error: gameError } = await supabase.from("games").insert({
      organizer_id: userData.user.id,
      title: data.title,
      description: data.description ?? null,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      venue_lat: finalCoords?.lat ?? null,
      venue_lng: finalCoords?.lng ?? null,
      date_time: new Date(data.date_time).toISOString(),
      price_per_player: Math.round(data.price_per_player * 100),
      max_players: data.max_players,
      num_teams: data.num_teams,
      format: data.format,
      round_duration_minutes: data.round_duration_minutes,
      payment_type: data.payment_type,
      status: "open",
    }).select().single();

    if (gameError || !game) {
      setError(gameError?.message ?? "Failed to create game");
      return;
    }

    const teamsToInsert = TEAM_COLORS.slice(0, data.num_teams).map((tc, i) => ({
      game_id: game.id,
      name: tc.name,
      color: tc.color,
      slot_number: i + 1,
    }));
    await supabase.from("teams").insert(teamsToInsert);

    router.push(`/organizer/games/${game.id}/manage`);
  }

  const fieldClass = "w-full bg-secondary border border-border text-white rounded-lg p-3 text-sm focus:border-rondo-yellow focus:outline-none placeholder:text-muted-foreground";
  const labelClass = "text-muted-foreground text-xs uppercase tracking-wider";

  return (
    <div className="min-h-[100dvh] pb-8">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors cursor-pointer" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-base">Create Game</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        <div className="space-y-1.5">
          <Label className={labelClass}>Game Title *</Label>
          <Input {...register("title")} placeholder="Thursday Night Futsal" className="bg-secondary border-border text-white" />
          {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className={labelClass}>Venue Name *</Label>
          <Input {...register("venue_name")} placeholder="BGC Futsal Court" className="bg-secondary border-border text-white" />
          {errors.venue_name && <p className="text-destructive text-xs">{errors.venue_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className={labelClass}>Full Address *</Label>
          <div className="relative">
            <Input
              {...register("venue_address")}
              placeholder="9th Ave, Bonifacio Global City, Taguig"
              className="bg-secondary border-border text-white pr-10"
              onBlur={async (e) => {
                const address = e.target.value.trim();
                if (!address || address.length < 5) return;
                setGeocoding(true);
                const result = await geocodeAddress(address);
                setCoords(result);
                setGeocoding(false);
              }}
            />
            {/* Location status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {geocoding && (
                <div className="w-3 h-3 rounded-full border-2 border-rondo-yellow border-t-transparent animate-spin" />
              )}
              {!geocoding && coords && (
                <div className="w-3 h-3 rounded-full bg-green-400" title="Location found" />
              )}
            </div>
          </div>
          {errors.venue_address && <p className="text-destructive text-xs">{errors.venue_address.message}</p>}
          {!geocoding && coords && (
            <p className="text-green-400 text-xs">Location pinned on map</p>
          )}
          {!geocoding && !coords && (
            <p className="text-muted-foreground text-xs">Leave the field to auto-detect location</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className={labelClass}>Date & Time *</Label>
          <input {...register("date_time")} type="datetime-local" className={fieldClass} />
          {errors.date_time && <p className="text-destructive text-xs">{errors.date_time.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Price per Player (&#8369;)</Label>
            <Input {...register("price_per_player")} type="number" min="0" className="bg-secondary border-border text-white" />
            {errors.price_per_player && <p className="text-destructive text-xs">{errors.price_per_player.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Max Players</Label>
            <Input {...register("max_players")} type="number" min="2" max="100" className="bg-secondary border-border text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Number of Teams</Label>
            <select {...register("num_teams")} className={fieldClass}>
              {[2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Format</Label>
            <select {...register("format")} className={fieldClass}>
              {["3v3","4v4","5v5","6v6","7v7","8v8","11v11"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Round Duration (min)</Label>
            <Input {...register("round_duration_minutes")} type="number" min="1" max="60" className="bg-secondary border-border text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Payment</Label>
            <select {...register("payment_type")} className={fieldClass}>
              <option value="venue">Pay at Venue</option>
              <option value="online">Online (PayMongo)</option>
            </select>
          </div>
        </div>

        {/* Team preview */}
        <div className="space-y-2">
          <Label className={labelClass}>Teams Preview</Label>
          <div className="flex flex-wrap gap-2">
            {TEAM_COLORS.slice(0, numTeams).map((t) => (
              <div key={t.name} className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-white text-xs font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className={labelClass}>Description (optional)</Label>
          <textarea {...register("description")} placeholder="Any extra details for players..." className={`${fieldClass} h-20 resize-none`} />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || geocoding}
          className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all min-h-[52px]"
        >
          {isSubmitting ? "Creating..." : "Create Game"}
        </Button>
      </form>
    </div>
  );
}
