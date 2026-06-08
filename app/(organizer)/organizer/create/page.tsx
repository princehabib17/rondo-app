"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

// ── Format presets ─────────────────────────────────────────────────────
const FORMAT_PRESETS = [
  { label: "3v3", format: "3v3", maxPlayers: 6 },
  { label: "5v5", format: "5v5", maxPlayers: 10 },
  { label: "6v6", format: "6v6", maxPlayers: 12 },
  { label: "7v7", format: "7v7", maxPlayers: 14 },
  { label: "11v11", format: "11v11", maxPlayers: 22 },
];

const TEAM_COLORS = [
  { name: "Red", color: "#ef4444" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Yellow", color: "#F5E642" },
  { name: "Green", color: "#22c55e" },
  { name: "Orange", color: "#f97316" },
  { name: "Purple", color: "#a855f7" },
  { name: "White", color: "#f1f5f9" },
  { name: "Pink", color: "#ec4899" },
];

const schema = z.object({
  title: z.string().min(3, "Title required"),
  venue_name: z.string().min(2, "Venue name required"),
  venue_address: z.string().min(5, "Address required"),
  date_time: z.string().min(1, "Date and time required"),
  format: z.string().min(1),
  max_players: z.coerce.number().min(2).max(100),
  num_teams: z.coerce.number().min(2).max(8),
  payment_mode: z.enum(["free", "venue", "online"]),
  price_per_player: z.coerce.number().min(0),
  round_duration_minutes: z.coerce.number().min(1).max(60),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function geocodeAddress(address: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ph`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* continue without coords */ }
  return null;
}

const inputClass = "w-full bg-[#1c1c1c] border-0 text-white font-body text-sm px-4 py-3.5 rounded-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rondo-accent/50";
const labelClass = "font-heading text-white/50 text-[10px] uppercase tracking-widest";

export default function CreateGamePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      format: "5v5",
      max_players: 10,
      num_teams: 2,
      payment_mode: "online",
      price_per_player: 250,
      round_duration_minutes: 8,
    },
  });

  const paymentMode = watch("payment_mode");
  const numTeams = watch("num_teams");
  const currentFormat = watch("format");

  function selectFormat(preset: typeof FORMAT_PRESETS[0]) {
    setValue("format", preset.format);
    setValue("max_players", preset.maxPlayers);
  }

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    let finalCoords = coords;
    if (!finalCoords) {
      finalCoords = await geocodeAddress(`${data.venue_name}, ${data.venue_address}`);
    }

    const priceCentavos = data.payment_mode === "free" ? 0 : Math.round(data.price_per_player * 100);
    const paymentType = data.payment_mode === "online" ? "online" : "venue";

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        organizer_id: userData.user.id,
        title: data.title,
        description: data.description ?? null,
        venue_name: data.venue_name,
        venue_address: data.venue_address,
        venue_lat: finalCoords?.lat ?? null,
        venue_lng: finalCoords?.lng ?? null,
        date_time: new Date(data.date_time).toISOString(),
        price_per_player: priceCentavos,
        max_players: data.max_players,
        num_teams: data.num_teams,
        format: data.format,
        round_duration_minutes: data.round_duration_minutes,
        payment_type: paymentType,
        status: "open",
      })
      .select()
      .single();

    if (gameError || !game) {
      setError(gameError?.message ?? "Failed to create game");
      return;
    }

    await supabase.from("teams").insert(
      TEAM_COLORS.slice(0, data.num_teams).map((tc, i) => ({
        game_id: game.id,
        name: tc.name,
        color: tc.color,
        slot_number: i + 1,
      }))
    );

    router.push(`/organizer/games/${game.id}/manage`);
  }

  return (
    <div className="min-h-[100dvh] bg-black pb-10">
      <header className="sticky top-0 z-40 bg-black border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-white/70"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-white font-black italic text-xl uppercase">New Game</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-6 space-y-6 max-w-lg mx-auto">

        {/* ── Section 1: Basics ────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Game Title *</label>
            <input {...register("title")} placeholder="Thursday Night 5v5" className={inputClass} />
            {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Venue Name *</label>
            <input {...register("venue_name")} placeholder="BGC Futsal Court" className={inputClass} />
            {errors.venue_name && <p className="text-red-400 text-xs">{errors.venue_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Address *</label>
            <div className="relative">
              <input
                {...register("venue_address")}
                placeholder="9th Ave, Bonifacio Global City, Taguig"
                className={`${inputClass} pr-10`}
                onBlur={async (e) => {
                  const address = e.target.value.trim();
                  if (address.length < 5) return;
                  setGeocoding(true);
                  const result = await geocodeAddress(address);
                  setCoords(result);
                  setGeocoding(false);
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {geocoding && (
                  <div className="w-3.5 h-3.5 border-2 border-rondo-accent border-t-transparent rounded-full animate-spin" />
                )}
                {!geocoding && coords && (
                  <MapPin size={14} className="text-green-400" />
                )}
              </div>
            </div>
            {coords && !geocoding && (
              <p className="text-green-400/80 text-xs flex items-center gap-1">
                <MapPin size={10} /> Location pinned on map
              </p>
            )}
            {errors.venue_address && <p className="text-red-400 text-xs">{errors.venue_address.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Date & Time *</label>
            <input {...register("date_time")} type="datetime-local" className={inputClass} />
            {errors.date_time && <p className="text-red-400 text-xs">{errors.date_time.message}</p>}
          </div>
        </section>

        {/* ── Section 2: Format ────────────────────────────────────── */}
        <section className="space-y-3">
          <p className={labelClass}>Format</p>
          <div className="flex gap-2 flex-wrap">
            {FORMAT_PRESETS.map((preset) => (
              <button
                key={preset.format}
                type="button"
                onClick={() => selectFormat(preset)}
                className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border transition-all active:scale-95 ${
                  currentFormat === preset.format
                    ? "bg-rondo-accent text-black border-rondo-accent"
                    : "bg-transparent border-white/15 text-white/50 hover:border-white/30"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Max Players</label>
              <input {...register("max_players")} type="number" min="2" max="100" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Teams</label>
              <select {...register("num_teams")} className={inputClass}>
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} teams</option>
                ))}
              </select>
            </div>
          </div>

          {/* Team color preview */}
          <div className="flex gap-1.5 flex-wrap">
            {TEAM_COLORS.slice(0, numTeams || 2).map((t) => (
              <div key={t.name} className="flex items-center gap-1.5 bg-[#1c1c1c] rounded-lg px-2.5 py-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-white/60 text-[11px] font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Payment ───────────────────────────────────── */}
        <section className="space-y-3">
          <p className={labelClass}>Payment</p>
          <Controller
            name="payment_mode"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "free", label: "Free" },
                  { value: "venue", label: "At Venue" },
                  { value: "online", label: "Online" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all active:scale-95 ${
                      field.value === opt.value
                        ? "bg-rondo-accent text-black border-rondo-accent"
                        : "border-white/15 text-white/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          />

          {paymentMode !== "free" && (
            <div className="space-y-1.5">
              <label className={labelClass}>Price per Player (₱)</label>
              <input
                {...register("price_per_player")}
                type="number"
                min="0"
                step="50"
                placeholder="250"
                className={inputClass}
              />
              {paymentMode === "online" && (
                <p className="text-white/30 text-xs">Players pay via GCash, Maya, or card</p>
              )}
            </div>
          )}
        </section>

        {/* ── Section 4: Advanced (collapsed) ─────────────────────── */}
        <section>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Round Duration (min)</label>
                <input {...register("round_duration_minutes")} type="number" min="1" max="60" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  {...register("description")}
                  placeholder="Any extra details for players…"
                  className={`${inputClass} h-20 resize-none`}
                />
              </div>
            </div>
          )}
        </section>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-xl py-3 px-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 min-h-[52px]"
        >
          {isSubmitting ? "Creating…" : "Create Game"}
        </button>
      </form>
    </div>
  );
}
