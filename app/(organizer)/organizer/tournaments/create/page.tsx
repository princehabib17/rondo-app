"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format as fnsFormat } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import { DateDrumRollPicker } from "@/components/ui/date-drum-roll-picker";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { OrganizationPicker } from "@/components/organizer/OrganizationPicker";

const SAMPLE_COVERS = [
  { label: "Football", src: "/samples/football.svg" },
  { label: "Futsal", src: "/samples/futsal.svg" },
];

const schema = z.object({
  name: z.string().min(3, "Tournament name required").max(120),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "round_robin"]),
  starts_date: z.string().min(1, "Start date required"),
  starts_time: z.string().min(1, "Start time required"),
  venue_name: z.string().min(2, "Venue name required"),
  venue_address: z.string().optional(),
  max_teams: z.coerce.number().min(2).max(64),
  team_size: z.coerce.number().min(1).max(11),
  entry_fee: z.coerce.number().min(0),
});

type CreateTournamentForm = z.infer<typeof schema>;
type StepId = "identity" | "venue" | "structure" | "review";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const STEPS: { id: StepId; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "venue", label: "Venue" },
  { id: "structure", label: "Structure" },
  { id: "review", label: "Review" },
];

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/30 focus:border-rondo-accent";
const labelClass = "text-[10px] font-black uppercase tracking-[0.18em] text-white/45";
const errorClass = "text-red-400 text-xs mt-1 flex items-center gap-1.5";

async function searchAddress(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("identity");
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [organizationsReady, setOrganizationsReady] = useState(false);

  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverSampleUrl, setCoverSampleUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Address
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Date
  const [pickedDate, setPickedDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time
  const [startTime, setStartTime] = useState("09:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateTournamentForm>({
    resolver: zodResolver(schema) as Resolver<CreateTournamentForm>,
    defaultValues: {
      format: "single_elimination",
      max_teams: 8,
      team_size: 5,
      entry_fee: 0,
      starts_date: "",
      starts_time: "09:00",
    },
  });

  const values = watch();
  const currentIndex = STEPS.findIndex((item) => item.id === step);
  const format = watch("format");
  const maxTeams = Number(watch("max_teams") || 0);
  const teamSize = Number(watch("team_size") || 0);
  const entryFee = Number(watch("entry_fee") || 0);
  const totalPlayers = maxTeams * teamSize;
  const formatLabel = format === "single_elimination" ? "Knockout" : "League";
  const prizePoolHint = useMemo(() => entryFee * maxTeams, [entryFee, maxTeams]);

  // Sync picked date to form
  useEffect(() => {
    if (pickedDate) {
      setValue("starts_date", fnsFormat(pickedDate, "yyyy-MM-dd"));
    }
  }, [pickedDate, setValue]);

  // Address autocomplete
  const handleAddressChange = useCallback(
    (val: string) => {
      setAddressInput(val);
      setValue("venue_address", val);
      if (addressDebounce.current) clearTimeout(addressDebounce.current);
      if (val.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setAddressLoading(true);
      addressDebounce.current = setTimeout(async () => {
        const results = await searchAddress(val);
        setAddressLoading(false);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }, 500);
    },
    [setValue]
  );

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function selectSuggestion(result: NominatimResult) {
    const parts = result.display_name.split(",");
    const shortAddress = parts.slice(0, 4).join(",").trim();
    setAddressInput(shortAddress);
    setValue("venue_address", shortAddress);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleTimeChange(val: string) {
    setStartTime(val);
    setValue("starts_time", val);
  }

  // Cover handlers
  function openFileForCover(file: File) {
    setCropSrc(URL.createObjectURL(file));
  }

  function handleCropDone(blob: Blob) {
    const croppedFile = new File([blob], "cover.jpg", { type: "image/jpeg" });
    setCoverFile(croppedFile);
    setCoverPreview(URL.createObjectURL(blob));
    setCoverSampleUrl(null);
    setCropSrc(null);
  }

  function useSampleCover(src: string) {
    setCoverFile(null);
    setCoverPreview(src);
    setCoverSampleUrl(src);
  }

  async function goNext() {
    setError(null);
    if (step === "identity") {
      const ok = await trigger(["name", "description"]);
      if (!ok || !organizationId) {
        setError(
          !organizationId
            ? "Choose or create an organization first."
            : "Fill in the tournament name."
        );
        return;
      }
    }
    if (step === "venue") {
      const ok = await trigger(["venue_name", "starts_date", "starts_time"]);
      if (!ok || !pickedDate) {
        setError("Add a valid venue, date, and start time.");
        return;
      }
    }
    if (step === "structure") {
      const ok = await trigger(["format", "max_teams", "team_size", "entry_fee"]);
      if (!ok) return;
    }
    setStep(STEPS[Math.min(currentIndex + 1, STEPS.length - 1)].id);
  }

  function goBack() {
    if (currentIndex === 0) { router.back(); return; }
    setStep(STEPS[currentIndex - 1].id);
  }

  async function onSubmit(input: CreateTournamentForm) {
    setError(null);
    if (!organizationId) {
      setError("Choose or create an organization first.");
      return;
    }
    if (!pickedDate) {
      setError("Select a start date.");
      return;
    }

    const startsAt = new Date(`${input.starts_date}T${input.starts_time}:00`).toISOString();
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description || undefined,
        format: input.format,
        startsAt,
        venueName: input.venue_name,
        venueAddress: input.venue_address || undefined,
        maxTeams: input.max_teams,
        teamSize: input.team_size,
        entryFee: Math.round(input.entry_fee * 100),
        organizationId,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not create tournament");
      return;
    }

    // Upload cover or use sample
    let bannerUrl: string | null = null;
    if (coverFile && json.tournamentId) {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const path = `tournaments/${userData.user?.id ?? "organizer"}/${json.tournamentId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("game-covers")
        .upload(path, coverFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("game-covers").getPublicUrl(path);
        bannerUrl = data.publicUrl;
      }
    } else if (coverSampleUrl) {
      bannerUrl = `${window.location.origin}${coverSampleUrl}`;
    }

    if (bannerUrl && json.tournamentId) {
      const supabase = createClient();
      await supabase.from("tournaments").update({ banner_url: bannerUrl }).eq("id", json.tournamentId);
    }

    router.push(`/organizer/tournaments/${json.tournamentId}/manage`);
  }

  return (
    <div className="min-h-[100dvh] rondo-page pb-28">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
              Tournament builder
            </p>
            <h1 className="rondo-hero-title truncate text-2xl text-white">Create Cup</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white">
            {currentIndex + 1}/{STEPS.length}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Step indicators */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => index <= currentIndex && setStep(item.id)}
              className="space-y-1 text-left"
              disabled={index > currentIndex}
            >
              <span
                className={`block h-1.5 rounded-full ${
                  index <= currentIndex ? "bg-rondo-accent" : "bg-white/10"
                }`}
              />
              <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-white/45">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── IDENTITY ── */}
          {step === "identity" && (
            <section className="space-y-5">
              {/* Cover with sample picker */}
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5">
                {coverPreview ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[calc(2rem-0.375rem)]">
                    <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setCoverSampleUrl(null);
                      }}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <ImagePlus size={13} /> Change
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(circle_at_70%_20%,rgba(245,197,24,0.15),transparent_35%),linear-gradient(135deg,#171717,#050505)]">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-3xl bg-rondo-accent text-rondo-black">
                      <Trophy size={28} />
                    </div>
                    {/* Sample covers */}
                    <div className="flex gap-3">
                      {SAMPLE_COVERS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => useSampleCover(s.src)}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className="w-20 h-12 rounded-lg overflow-hidden border border-white/20 group-hover:border-rondo-accent/60 transition-colors">
                            <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider group-hover:text-rondo-accent transition-colors">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-full bg-rondo-accent px-4 py-2 text-xs font-black uppercase tracking-wide text-rondo-black"
                    >
                      <ImagePlus size={14} />
                      Upload cover
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) openFileForCover(file);
                  e.target.value = "";
                }}
              />

              <OrganizationPicker
                value={organizationId}
                onChange={setOrganizationId}
                onReady={setOrganizationsReady}
              />

              <div className="space-y-2">
                <Label className={labelClass}>Tournament name</Label>
                <input {...register("name")} placeholder="Rondo Summer Cup" className={fieldClass} />
                {errors.name && (
                  <p className={errorClass}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Story and rules</Label>
                <textarea
                  {...register("description")}
                  rows={5}
                  maxLength={2000}
                  placeholder="Prizes, registration rules, schedule flow, refund policy..."
                  className={`${fieldClass} min-h-32 resize-none`}
                />
              </div>
            </section>
          )}

          {/* ── VENUE ── */}
          {step === "venue" && (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5">
                <div className="rounded-[calc(2rem-0.375rem)] bg-[#090909] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">Schedule</p>
                      <h2 className="rondo-hero-title mt-1 text-4xl text-white">Where it happens</h2>
                    </div>
                    <MapPin className="text-rondo-accent" size={30} />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_25%_35%,rgba(245,197,24,0.18),transparent_12%),radial-gradient(circle_at_68%_62%,rgba(245,197,24,0.14),transparent_10%),linear-gradient(135deg,#111,#050505)] p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/45">Venue preview</p>
                    <p className="mt-2 text-lg font-black text-white">{values.venue_name || "Pick a venue"}</p>
                    <p className="mt-1 text-sm text-white/45">{addressInput || "Address will appear here"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Venue name</Label>
                <input {...register("venue_name")} placeholder="Sparta Futsal Arena" className={fieldClass} />
                {errors.venue_name && (
                  <p className={errorClass}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                    {errors.venue_name.message}
                  </p>
                )}
              </div>

              {/* Address with autocomplete */}
              <div className="space-y-2">
                <Label className={labelClass}>Address</Label>
                <div className="relative" ref={suggestionsRef}>
                  <input
                    value={addressInput}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Start typing an address..."
                    className={`${fieldClass} pr-8`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {addressLoading && (
                      <Loader2 size={14} className="text-white/30 animate-spin" />
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-white/15 bg-[#141414] shadow-2xl">
                      {suggestions.map((s, i) => {
                        const parts = s.display_name.split(",");
                        return (
                          <button
                            key={i}
                            type="button"
                            className="flex w-full items-start gap-3 border-b border-white/[0.06] px-4 py-3 text-left last:border-0 hover:bg-white/[0.06]"
                            onMouseDown={() => selectSuggestion(s)}
                          >
                            <MapPin size={14} className="mt-0.5 shrink-0 text-rondo-accent" />
                            <span>
                              <span className="block text-sm font-semibold text-white">
                                {parts.slice(0, 2).join(",").trim()}
                              </span>
                              <span className="mt-0.5 block text-xs text-white/40">
                                {parts.slice(2, 4).join(",").trim()}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!addressLoading && addressInput.length >= 3 && suggestions.length === 0 && !showSuggestions && (
                    <p className="mt-1 text-xs text-white/30">No suggestions — try a more specific address.</p>
                  )}
                </div>
              </div>

              {/* Date drum roll */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Start date</Label>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker((v) => !v)}
                    className="text-rondo-accent text-xs font-semibold"
                  >
                    {showDatePicker ? "Done" : (pickedDate ? fnsFormat(pickedDate, "MMM d, yyyy") : "Pick date")}
                  </button>
                </div>
                {!showDatePicker && (
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="flex min-h-[46px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left text-sm font-semibold text-white"
                  >
                    {pickedDate ? fnsFormat(pickedDate, "EEEE, MMMM d, yyyy") : "Tap to pick a date"}
                    <CalendarDays size={16} className="text-rondo-accent" />
                  </button>
                )}
                {showDatePicker && (
                  <DateDrumRollPicker
                    value={pickedDate}
                    onChange={(d) => {
                      setPickedDate(d);
                      setValue("starts_date", fnsFormat(d, "yyyy-MM-dd"));
                    }}
                  />
                )}
                <input type="hidden" {...register("starts_date")} />
                {errors.starts_date && !pickedDate && (
                  <p className={errorClass}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                    {errors.starts_date.message}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label className={labelClass}>Start time</Label>
                <button
                  type="button"
                  onClick={() => setShowTimePicker((v) => !v)}
                  className="flex min-h-[46px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left text-sm font-black text-white"
                >
                  {formatTime12h(startTime)}
                  <CalendarDays size={16} className="text-rondo-accent" />
                </button>
                <input type="hidden" {...register("starts_time")} />
              </div>
              {showTimePicker && <DrumRollPicker value={startTime} onChange={handleTimeChange} />}
            </section>
          )}

          {/* ── STRUCTURE ── */}
          {step === "structure" && (
            <section className="space-y-5">
              <div className="grid gap-3">
                {([
                  {
                    value: "single_elimination",
                    title: "Knockout cup",
                    note: "Fast bracket, high pressure, clear champion.",
                  },
                  {
                    value: "round_robin",
                    title: "League table",
                    note: "More games, fairer ranking, better for groups.",
                  },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue("format", option.value)}
                    className={`rounded-[1.5rem] border p-4 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      format === option.value
                        ? "border-rondo-accent bg-rondo-accent/10"
                        : "border-white/10 bg-white/[0.035]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-white">{option.title}</p>
                        <p className="mt-1 text-sm text-white/45">{option.note}</p>
                      </div>
                      {format === option.value && <Check size={20} className="text-rondo-accent" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className={labelClass}>Teams</Label>
                  <input {...register("max_teams")} type="number" min={2} max={64} className={fieldClass} />
                  {errors.max_teams && (
                    <p className={errorClass}>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                      Required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Per side</Label>
                  <input {...register("team_size")} type="number" min={1} max={11} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Fee (₱)</Label>
                  <input {...register("entry_fee")} type="number" min={0} step="50" className={fieldClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <Users size={18} className="text-rondo-accent" />
                  <p className="mt-3 text-3xl font-black text-white">{totalPlayers || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/40">Max players</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <ShieldCheck size={18} className="text-rondo-accent" />
                  <p className="mt-3 text-3xl font-black text-white">₱{prizePoolHint || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/40">Gross entry</p>
                </div>
              </div>
            </section>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && (
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5">
                <div className="relative min-h-64 rounded-[calc(2rem-0.375rem)] bg-[#080808]">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-[calc(2rem-0.375rem)] object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(circle_at_70%_25%,rgba(245,197,24,0.24),transparent_22%),linear-gradient(135deg,#181818,#050505)]" />
                  )}
                  <div className="absolute inset-0 rounded-[calc(2rem-0.375rem)] bg-gradient-to-t from-black via-black/55 to-transparent" />
                  <div className="relative flex min-h-64 flex-col justify-end p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rondo-accent">
                      {formatLabel}
                    </p>
                    <h2 className="rondo-hero-title mt-1 text-5xl text-white">
                      {values.name || "Tournament"}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      {pickedDate ? fnsFormat(pickedDate, "MMM d") : "Date"} at{" "}
                      {formatTime12h(startTime)} — {values.venue_name || "Venue"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                {[
                  ["Organization", organizationId ? "Selected" : "Missing"],
                  ["Teams", `${maxTeams || 0} teams`],
                  ["Squad size", `${teamSize || 0} per side`],
                  ["Entry", entryFee > 0 ? `₱${entryFee} per team` : "Free"],
                  ["Address", addressInput || "Not added"],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-0"
                  >
                    <span className="text-sm text-white/45">{label}</span>
                    <span className="text-right text-sm font-bold text-white">{val}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-lg px-4 pb-2">
            {step === "review" ? (
              <button
                type="submit"
                disabled={isSubmitting || !organizationsReady}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-rondo-accent px-5 py-4 text-sm font-black uppercase tracking-widest text-rondo-black shadow-[0_18px_55px_rgba(245,197,24,0.16)] disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Publish tournament"}
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!organizationsReady}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-rondo-accent px-5 py-4 text-sm font-black uppercase tracking-widest text-rondo-black shadow-[0_18px_55px_rgba(245,197,24,0.16)] disabled:opacity-50"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Cover crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={16 / 10}
          label="Crop cover"
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
