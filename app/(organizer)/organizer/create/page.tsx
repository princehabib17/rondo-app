"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, MapPin, X } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parse, isValid, isBefore, addYears, format as fnsFormat } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import { OrganizationPicker } from "@/components/organizer/OrganizationPicker";
import { deriveMatchType } from "@/lib/feed/filters";

// ─── constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  { name: "Red", color: "#E53935" },
  { name: "Blue", color: "#1E88E5" },
  { name: "Yellow", color: "#F5E642" },
  { name: "Green", color: "#43A047" },
  { name: "Orange", color: "#FB8C00" },
  { name: "Purple", color: "#8E24AA" },
];

const FORMATS = ["3v3", "4v4", "5v5", "6v6", "7v7", "8v8", "11v11"];
const TEAM_COUNTS = [2, 3, 4, 5, 6, 7, 8];

// ─── schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, "Title required"),
  venue_name: z.string().min(2, "Venue name required"),
  venue_address: z.string().min(5, "Address required"),
  game_date: z.string().min(1, "Date required"),
  game_time: z.string().min(1, "Time required"),
  price_per_player: z.coerce.number().min(0),
  num_teams: z.coerce.number().min(2).max(8),
  format: z.string().min(1),
  round_duration_minutes: z.coerce.number().min(1).max(60),
  payment_type: z.enum(["online", "venue"]),
  allow_pay_later: z.boolean().default(false),
  is_private: z.boolean().default(false),
  skill_level: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["beginner", "intermediate", "advanced", "pro"]).optional()
  ),
  description: z.string().optional(),
});
type CreateGameForm = z.infer<typeof schema>;

// ─── helpers ──────────────────────────────────────────────────────────────────

function parsersToDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const ref = new Date();
  const formats = [
    "MMMM d yyyy", "MMMM d, yyyy", "MMM d yyyy", "MMM d, yyyy",
    "MMMM d", "MMM d",
    "M/d/yyyy", "M/d",
    "d MMMM yyyy", "d MMM yyyy", "d MMMM", "d MMM",
  ];
  for (const fmt of formats) {
    try {
      const parsed = parse(trimmed, fmt, ref);
      if (isValid(parsed)) {
        const needsYear = !fmt.includes("yyyy");
        if (needsYear && isBefore(parsed, new Date())) {
          return addYears(parsed, 1);
        }
        return parsed;
      }
    } catch { /* next */ }
  }
  return null;
}

function playersPerTeam(format: string): number {
  return parseInt(format.split("v")[0]) || 5;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ph`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch { return []; }
}

// ─── component ────────────────────────────────────────────────────────────────

const fieldClass =
  "w-full bg-white/[0.045] border border-white/18 text-white rounded-xl p-3 text-sm focus:border-rondo-yellow focus:outline-none placeholder:text-white/30";
const labelClass = "text-white/50 text-xs uppercase tracking-wider font-semibold";

export default function CreateGamePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [organizationsReady, setOrganizationsReady] = useState(false);

  // Cover photo
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Address autocomplete
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Date smart input
  const [dateInput, setDateInput] = useState("");
  const [parsedDate, setParsedDate] = useState<Date | null>(null);

  // Time drum roll
  const [gameTime, setGameTime] = useState("19:00"); // HH:MM 24h
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateGameForm>({
    resolver: zodResolver(schema) as Resolver<CreateGameForm>,
    defaultValues: {
      format: "5v5",
      round_duration_minutes: 8,
      payment_type: "online",
      allow_pay_later: false,
      is_private: false,
      num_teams: 2,
      price_per_player: 200,
      game_date: "",
      game_time: "19:00",
    },
  });

  const format = watch("format");
  const numTeams = watch("num_teams") || 2;
  const maxPlayers = playersPerTeam(format) * numTeams;

  // ── address autocomplete ─────────────────────────────────────────────────
  const handleAddressChange = useCallback((val: string) => {
    setAddressInput(val);
    setValue("venue_address", val);
    setCoords(null);
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    addressDebounce.current = setTimeout(async () => {
      const results = await searchAddress(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 600);
  }, [setValue]);

  function selectSuggestion(result: NominatimResult) {
    const parts = result.display_name.split(",");
    const shortAddress = parts.slice(0, 4).join(",").trim();
    setAddressInput(shortAddress);
    setValue("venue_address", shortAddress);
    setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setSuggestions([]);
    setShowSuggestions(false);
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── date smart input ─────────────────────────────────────────────────────
  function handleDateChange(val: string) {
    setDateInput(val);
    const d = parsersToDate(val);
    setParsedDate(d);
    if (d) setValue("game_date", fnsFormat(d, "yyyy-MM-dd"));
    else setValue("game_date", "");
  }

  // ── time drum roll ───────────────────────────────────────────────────────
  function handleTimeChange(val: string) {
    setGameTime(val);
    setValue("game_time", val);
  }

  function formatTime12h(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  // ── cover file ───────────────────────────────────────────────────────────
  function handleCoverFile(file: File) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  // ── submit ───────────────────────────────────────────────────────────────
  async function onSubmit(data: CreateGameForm) {
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    if (!organizationId) { setError("Choose or create an organization first."); return; }
    if (!parsedDate) { setError("Enter a valid date (e.g. September 4)."); return; }

    const dateTime = new Date(`${data.game_date}T${data.game_time}:00`).toISOString();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        organizer_id: userData.user.id,
        organization_id: organizationId,
        title: data.title,
        description: data.description ?? null,
        venue_name: data.venue_name,
        venue_address: data.venue_address,
        venue_lat: coords?.lat ?? null,
        venue_lng: coords?.lng ?? null,
        date_time: dateTime,
        price_per_player: Math.round(data.price_per_player * 100),
        max_players: maxPlayers,
        num_teams: data.num_teams,
        format: data.format,
        match_type: deriveMatchType(data.format),
        skill_level: data.skill_level ?? null,
        is_private: data.is_private,
        round_duration_minutes: data.round_duration_minutes,
        payment_type: data.payment_type,
        allow_pay_later: data.allow_pay_later,
        status: "open",
      })
      .select()
      .single();

    if (gameError || !game) {
      setError(gameError?.message ?? "Failed to create match");
      return;
    }

    // Upload cover if selected
    if (coverFile) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const path = `${userData.user.id}/${game.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("game-covers")
        .upload(path, coverFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("game-covers").getPublicUrl(path);
        await supabase.from("games").update({ banner_url: urlData.publicUrl }).eq("id", game.id);
      }
    }

    const teams = TEAM_COLORS.slice(0, data.num_teams).map((tc, i) => ({
      game_id: game.id,
      name: tc.name,
      color: tc.color,
      slot_number: i + 1,
    }));
    await supabase.from("teams").insert(teams);

    router.push(`/organizer/games/${game.id}/manage`);
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-12">
      {/* header */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-white/10 z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-yellow transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rondo-yellow">
            Match builder
          </p>
          <h1 className="rondo-hero-title text-2xl">Create Match</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto space-y-0">

        <div className="px-4 py-5">
          <div className="rounded-2xl border border-rondo-yellow/15 bg-rondo-yellow/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rondo-yellow">
              Step 1 of 5
            </p>
            <h2 className="mt-1 font-heading text-2xl font-black uppercase italic leading-none text-white">
              Start with the match page players will see.
            </h2>
            <p className="mt-2 text-sm leading-5 text-white/55">
              Add the cover, venue, format, payment rule, and team shape before publishing.
            </p>
          </div>
        </div>

        {/* ── cover photo ── */}
        <div className="relative">
          {coverPreview ? (
            <div className="relative w-full aspect-video">
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                type="button"
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                <ImagePlus size={13} /> Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-white/[0.025] border-b border-dashed border-white/15 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-rondo-accent/15 flex items-center justify-center">
                <ImagePlus size={22} className="text-rondo-accent" />
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">Add cover photo</p>
                <p className="text-white/35 text-xs mt-0.5">Tap to open gallery · 16:9 ratio</p>
              </div>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCoverFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* ── form fields ── */}
        <div className="px-4 pt-5 space-y-5">

          {/* Organization */}
          <OrganizationPicker
            value={organizationId}
            onChange={setOrganizationId}
            onReady={setOrganizationsReady}
          />

          {/* Match title */}
          <div className="space-y-1.5">
            <Label className={labelClass}>Match Title *</Label>
            <input
              {...register("title")}
              placeholder="Thursday Night Futsal"
              className={fieldClass}
            />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          {/* ── Location ── */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-rondo-accent" />
              <p className="font-heading text-sm font-black uppercase text-white">Location</p>
            </div>

            <div className="space-y-1.5">
              <Label className={labelClass}>Venue Name *</Label>
              <input
                {...register("venue_name")}
                placeholder="BGC Futsal Court"
                className={fieldClass}
              />
              {errors.venue_name && <p className="text-destructive text-xs">{errors.venue_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className={labelClass}>Full Address *</Label>
              <div className="relative" ref={suggestionsRef}>
                <input
                  value={addressInput}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Start typing an address…"
                  className={`${fieldClass} pr-8`}
                />
                {/* pin indicator */}
                {coords && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-400" />
                )}

                {/* suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1a1a1a] border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.map((s, i) => {
                      const parts = s.display_name.split(",");
                      const primary = parts.slice(0, 2).join(",").trim();
                      const secondary = parts.slice(2, 4).join(",").trim();
                      return (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-white/[0.06] flex items-start gap-3 border-b border-white/[0.06] last:border-0"
                          onMouseDown={() => selectSuggestion(s)}
                        >
                          <MapPin size={14} className="text-rondo-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white text-sm font-medium">{primary}</p>
                            {secondary && <p className="text-white/40 text-xs mt-0.5">{secondary}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.venue_address && <p className="text-destructive text-xs">{errors.venue_address.message}</p>}
              {coords && <p className="text-green-400 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Location pinned on map</p>}
            </div>
          </div>

          {/* ── Date & Time ── */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-heading text-sm font-black uppercase text-white">Date &amp; Time</p>

            {/* Date smart input */}
            <div className="space-y-1.5">
              <Label className={labelClass}>Date *</Label>
              <input
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="e.g. September 4 or Sep 4 2026"
                className={fieldClass}
                autoComplete="off"
              />
              {dateInput && (
                <p className={`text-xs font-medium ${parsedDate ? "text-green-400" : "text-white/30"}`}>
                  {parsedDate
                    ? fnsFormat(parsedDate, "EEEE, MMMM d, yyyy")
                    : "Keep typing… (try Sep 4, 9/4, September 4 2026)"}
                </p>
              )}
              {errors.game_date && !parsedDate && (
                <p className="text-destructive text-xs">{errors.game_date.message}</p>
              )}
              {/* hidden field for form validation */}
              <input type="hidden" {...register("game_date")} />
            </div>

            {/* Time drum roll */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>Time *</Label>
                <button
                  type="button"
                  onClick={() => setShowTimePicker((v) => !v)}
                  className="text-rondo-accent text-xs font-semibold"
                >
                  {showTimePicker ? "Done" : formatTime12h(gameTime)}
                </button>
              </div>

              {!showTimePicker && (
                <button
                  type="button"
                  onClick={() => setShowTimePicker(true)}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 py-3 text-center text-white font-semibold text-lg"
                >
                  {formatTime12h(gameTime)}
                </button>
              )}

              {showTimePicker && (
                <DrumRollPicker value={gameTime} onChange={handleTimeChange} />
              )}

              <input type="hidden" {...register("game_time")} />
            </div>
          </div>

          {/* ── Format & Teams ── */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-heading text-sm font-black uppercase text-white">Match Setup</p>

            {/* Format pills */}
            <div className="space-y-2">
              <Label className={labelClass}>Format</Label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setValue("format", f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      format === f
                        ? "bg-rondo-yellow text-rondo-black"
                        : "bg-white/[0.06] text-white/60 border border-white/10"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Num teams pills */}
            <div className="space-y-2">
              <Label className={labelClass}>Number of Teams</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setValue("num_teams", n)}
                    className={`w-11 h-11 rounded-xl text-sm font-bold transition-all ${
                      numTeams === n
                        ? "bg-rondo-yellow text-rondo-black"
                        : "bg-white/[0.06] text-white/60 border border-white/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto max players */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 flex items-center justify-between">
              <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Max Players</span>
              <div className="text-right">
                <span className="text-rondo-yellow font-black text-xl">{maxPlayers}</span>
                <span className="text-white/40 text-xs ml-1.5">
                  ({playersPerTeam(format)} per team × {numTeams} teams)
                </span>
              </div>
            </div>

            {/* Teams preview */}
            <div className="space-y-1.5">
              <Label className={labelClass}>Teams</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.slice(0, numTeams).map((t) => (
                  <div key={t.name} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-white text-xs font-semibold">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Details ── */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-heading text-sm font-black uppercase text-white">Details</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelClass}>Price per Player (₱)</Label>
                <input {...register("price_per_player")} type="number" min="0" className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Round Duration (min)</Label>
                <input {...register("round_duration_minutes")} type="number" min="1" max="60" className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelClass}>Skill Level</Label>
                <select {...register("skill_level")} className={fieldClass}>
                  <option value="">Any</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Payment</Label>
                <select {...register("payment_type")} className={fieldClass}>
                  <option value="venue">Pay at Venue</option>
                  <option value="online">Wallet / Online</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Options ── */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 cursor-pointer">
              <input type="checkbox" {...register("allow_pay_later")} className="mt-0.5 h-4 w-4 accent-[#E9FF3A]" />
              <span className="text-sm text-white/80 leading-snug">
                Allow reserve now, pay later
                <span className="block text-xs text-white/35 mt-0.5">If off, players must pay to reserve their spot.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 cursor-pointer">
              <input type="checkbox" {...register("is_private")} className="mt-0.5 h-4 w-4 accent-[#E9FF3A]" />
              <span className="text-sm text-white/80 leading-snug">
                Private match — approval required
                <span className="block text-xs text-white/35 mt-0.5">Players request to join; you choose who gets in.</span>
              </span>
            </label>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className={labelClass}>Describe your game or add extra information</Label>
            <textarea
              {...register("description")}
              placeholder="Skill range, parking, what to bring, any house rules…"
              rows={5}
              maxLength={800}
              className={`${fieldClass} h-32 resize-none`}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !organizationsReady}
            className="w-full bg-rondo-yellow text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all min-h-[52px] disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create Match"}
          </button>
        </div>
      </form>
    </div>
  );
}
