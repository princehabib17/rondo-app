"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parse, isValid, isBefore, addYears, format as fnsFormat } from "date-fns";
import { Label } from "@/components/ui/label";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import { OrganizationPicker } from "@/components/organizer/OrganizationPicker";

const schema = z.object({
  name: z.string().min(3, "Name required").max(120),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "round_robin"]),
  starts_date: z.string().min(1, "Start date required"),
  starts_time: z.string().min(1, "Start time required"),
  venue_name: z.string().min(2, "Venue required"),
  venue_address: z.string().optional(),
  max_teams: z.coerce.number().min(2).max(64),
  team_size: z.coerce.number().min(1).max(11),
  entry_fee: z.coerce.number().min(0),
});
type CreateTournamentForm = z.infer<typeof schema>;

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

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

async function searchAddress(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ph`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch { return []; }
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const fieldClass =
  "w-full bg-white/[0.045] border border-white/18 text-white rounded-xl p-3 text-sm focus:border-rondo-accent focus:outline-none placeholder:text-white/30";
const labelClass = "text-white/50 text-xs uppercase tracking-wider font-semibold";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [organizationsReady, setOrganizationsReady] = useState(false);

  // Address autocomplete
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Date smart input
  const [dateInput, setDateInput] = useState("");
  const [parsedDate, setParsedDate] = useState<Date | null>(null);

  // Time drum roll
  const [startTime, setStartTime] = useState("19:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<CreateTournamentForm>({
      resolver: zodResolver(schema) as Resolver<CreateTournamentForm>,
      defaultValues: {
        format: "single_elimination",
        max_teams: 8,
        team_size: 5,
        entry_fee: 0,
        starts_date: "",
        starts_time: "19:00",
      },
    });

  const format = watch("format");

  // ── address autocomplete ─────────────────────────────────────────────────
  const handleAddressChange = useCallback((val: string) => {
    setAddressInput(val);
    setValue("venue_address", val);
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
    setSuggestions([]);
    setShowSuggestions(false);
  }

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
    if (d) setValue("starts_date", fnsFormat(d, "yyyy-MM-dd"));
    else setValue("starts_date", "");
  }

  function handleTimeChange(val: string) {
    setStartTime(val);
    setValue("starts_time", val);
  }

  async function onSubmit(values: CreateTournamentForm) {
    setError(null);
    if (!organizationId) {
      setError("Choose or create an organization first.");
      return;
    }
    if (!parsedDate) {
      setError("Enter a valid start date (e.g. September 4).");
      return;
    }
    const startsAt = new Date(`${values.starts_date}T${values.starts_time}:00`).toISOString();

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description || undefined,
        format: values.format,
        startsAt,
        venueName: values.venue_name,
        venueAddress: values.venue_address || undefined,
        maxTeams: values.max_teams,
        teamSize: values.team_size,
        entryFee: Math.round(values.entry_fee * 100),
        organizationId,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not create tournament");
      return;
    }
    router.push(`/organizer/tournaments/${json.tournamentId}/manage`);
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-white/10 z-40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rondo-accent transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="rondo-hero-title text-2xl">Create Tournament</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-6 space-y-5 max-w-lg mx-auto">

        <div className="space-y-1.5">
          <Label className={labelClass}>Tournament Name *</Label>
          <input {...register("name")} placeholder="Rondo Summer Cup" className={fieldClass} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <OrganizationPicker
          value={organizationId}
          onChange={setOrganizationId}
          onReady={setOrganizationsReady}
        />

        {/* ── Format ── */}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="font-heading text-sm font-black uppercase text-white">Format</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "single_elimination", title: "Knockout", note: "Lose once, you're out" },
              { value: "round_robin", title: "League", note: "Everyone plays everyone" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("format", option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  format === option.value
                    ? "border-rondo-accent/60 bg-rondo-accent/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="text-white text-sm font-bold">{option.title}</p>
                <p className="text-white/45 text-xs mt-0.5">{option.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Location ── */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-rondo-accent" />
            <p className="font-heading text-sm font-black uppercase text-white">Location</p>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Venue Name *</Label>
            <input {...register("venue_name")} placeholder="Sparta Futsal Arena" className={fieldClass} />
            {errors.venue_name && <p className="text-destructive text-xs">{errors.venue_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Address (optional)</Label>
            <div className="relative" ref={suggestionsRef}>
              <input
                value={addressInput}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing an address…"
                className={fieldClass}
              />
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
          </div>
        </div>

        {/* ── Start Date & Time ── */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="font-heading text-sm font-black uppercase text-white">Starts</p>

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
            <input type="hidden" {...register("starts_date")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={labelClass}>Time *</Label>
              <button
                type="button"
                onClick={() => setShowTimePicker((v) => !v)}
                className="text-rondo-accent text-xs font-semibold"
              >
                {showTimePicker ? "Done" : formatTime12h(startTime)}
              </button>
            </div>

            {!showTimePicker && (
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 py-3 text-center text-white font-semibold text-lg"
              >
                {formatTime12h(startTime)}
              </button>
            )}

            {showTimePicker && (
              <DrumRollPicker value={startTime} onChange={handleTimeChange} />
            )}

            <input type="hidden" {...register("starts_time")} />
          </div>
        </div>

        {/* ── Setup ── */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="font-heading text-sm font-black uppercase text-white">Setup</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>Max Teams</Label>
              <input {...register("max_teams")} type="number" min={2} max={64} className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Per Side</Label>
              <input {...register("team_size")} type="number" min={1} max={11} className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Fee (₱)</Label>
              <input {...register("entry_fee")} type="number" min={0} step="50" className={fieldClass} />
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <Label className={labelClass}>Describe your tournament or add extra information</Label>
          <textarea
            {...register("description")}
            rows={5}
            maxLength={2000}
            placeholder="Rules, prizes, schedule, group stage details, refund policy…"
            className={`${fieldClass} h-32 resize-none`}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !organizationsReady}
          className="w-full bg-rondo-accent text-rondo-black font-black uppercase tracking-widest text-sm py-4 rounded-xl active:scale-[0.98] transition-all min-h-[52px] disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Tournament"}
        </button>
      </form>
    </div>
  );
}
