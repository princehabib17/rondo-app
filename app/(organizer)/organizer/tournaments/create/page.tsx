"use client";

/* Hallmark · genre: app-flow · macrostructure: step-wizard (one thing per screen)
 * design-system: docs/rondo-design-system.md (Matchday) · designed-as-app
 * gold roles this flow: primary CTA · money · progress fill
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  CheckCircle,
  CoinVertical,
  Image as ImageIcon,
  MapPin,
  PencilSimple,
  Spinner,
  Strategy,
  Trophy,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
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
import { TournamentCard } from "@/components/tournament/TournamentCard";
import type { Tournament } from "@/lib/supabase/types";
import { rondoFieldClass } from "@/components/rondo/primitives";
import { gentle } from "@/components/motion/springs";

const SAMPLE_COVERS = [
  { label: "Football", src: "/samples/football.svg" },
  { label: "Futsal", src: "/samples/futsal.svg" },
];

const schema = z.object({
  name: z.string().min(3, "Give it a name. At least 3 characters").max(120),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "round_robin"]),
  starts_date: z.string().min(1, "Pick a start date"),
  starts_time: z.string().min(1, "Pick a start time"),
  venue_name: z.string().min(2, "Where's it happening? Add a venue"),
  venue_address: z.string().optional(),
  max_teams: z.coerce.number().min(2, "At least 2 teams to make a bracket").max(64, "64 teams max"),
  team_size: z.coerce.number().min(1).max(11),
  entry_fee: z.coerce.number().min(0),
});

type CreateTournamentForm = z.infer<typeof schema>;
type StepKey = "basics" | "format" | "money" | "schedule" | "review";
type FormField = keyof CreateTournamentForm;

const STEPS: {
  key: StepKey;
  label: string;
  hint: string;
  fields: FormField[];
}[] = [
  { key: "basics", label: "Name your cup", hint: "The identity teams will rally behind", fields: ["name"] },
  { key: "format", label: "Pick the format", hint: "Bracket shape and squad limits", fields: ["format", "max_teams", "team_size"] },
  { key: "money", label: "Set the stakes", hint: "What each team pays to enter", fields: ["entry_fee"] },
  { key: "schedule", label: "Set the stage", hint: "Venue, date, and kickoff", fields: ["venue_name", "starts_date", "starts_time"] },
  { key: "review", label: "Kick it off", hint: "One last look before it goes live", fields: [] },
];

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const labelClass = "rondo-label text-[var(--ink-low)]";
const errorClass = "text-[var(--live)] rondo-meta mt-1 flex items-center gap-2";
const hintClass = "text-[var(--ink-low)] rondo-meta mt-1";

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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className={errorClass}>
      <span className="h-2 w-2 shrink-0 rounded-[var(--r-pill)] bg-[var(--live)]" />
      {message}
    </p>
  );
}

/**
 * Full-bleed visual band that leads every step. Pure CSS floodlight scene
 * (design system's stadium language, no external assets); the content inside
 * reacts live to what the organizer has typed so each screen feels staged,
 * not like a form.
 */
function StepScene({
  variant,
  gold,
  children,
}: {
  variant?: 0 | 1 | 2;
  gold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        gold
          ? "rondo-floodlight-scene--gold relative h-52 overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)]"
          : "rondo-floodlight-scene relative h-52 overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)]"
      }
      data-variant={variant}
    >
      {children}
    </div>
  );
}

/** Tiny pure-CSS bracket diagram for the knockout format card. */
function MiniBracket() {
  const slot = "h-2 w-7 rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--ink-hi)_22%,transparent)]";
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="flex flex-col gap-1.5">
        <span className={slot} />
        <span className={slot} />
        <span className={slot} />
        <span className={slot} />
      </div>
      <div className="flex flex-col gap-4">
        <span className={slot} />
        <span className={slot} />
      </div>
      <span className="h-2 w-7 rounded-[var(--r-pill)] bg-[var(--gold)]" />
    </div>
  );
}

/** Tiny pure-CSS league table for the round-robin format card. */
function MiniTable() {
  const row = "h-2 rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--ink-hi)_22%,transparent)]";
  return (
    <div className="flex w-24 flex-col gap-1.5" aria-hidden>
      <span className="h-2 w-full rounded-[var(--r-pill)] bg-[var(--gold)]" />
      <span className={`${row} w-5/6`} />
      <span className={`${row} w-4/6`} />
      <span className={`${row} w-3/6`} />
    </div>
  );
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
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

  // Date + time
  const [pickedDate, setPickedDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const format = watch("format");
  const maxTeams = Number(watch("max_teams") || 0);
  const teamSize = Number(watch("team_size") || 0);
  const entryFee = Number(watch("entry_fee") || 0);
  const totalPlayers = maxTeams * teamSize;
  const prizePoolHint = useMemo(() => entryFee * maxTeams, [entryFee, maxTeams]);

  const step = STEPS[stepIndex];
  const isReview = step.key === "review";

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

  function applySampleCover(src: string) {
    setCoverFile(null);
    setCoverPreview(src);
    setCoverSampleUrl(src);
  }

  // The review card mirrors the row `onSubmit` creates: what the organizer
  // approves on the last screen is exactly what players will see.
  const previewTournament: Tournament = useMemo(() => {
    const startsAt = pickedDate
      ? new Date(`${fnsFormat(pickedDate, "yyyy-MM-dd")}T${startTime || "09:00"}:00`).toISOString()
      : new Date().toISOString();
    return {
      id: "preview",
      organizer_id: "",
      organization_id: organizationId || null,
      name: values.name?.trim() || "Your tournament",
      description: values.description ?? null,
      format,
      status: "registration",
      venue_name: values.venue_name?.trim() || "Venue TBD",
      venue_address: addressInput || null,
      starts_at: startsAt,
      max_teams: maxTeams || 0,
      team_size: teamSize || 0,
      entry_fee: Math.round((entryFee || 0) * 100),
      banner_url: coverPreview,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tournament_teams: [],
    };
  }, [
    values.name,
    values.description,
    values.venue_name,
    format,
    addressInput,
    pickedDate,
    startTime,
    maxTeams,
    teamSize,
    entryFee,
    coverPreview,
    organizationId,
  ]);

  async function goNext() {
    setError(null);
    if (step.fields.length > 0) {
      const valid = await trigger(step.fields);
      if (!valid) return;
    }
    if (step.key === "basics" && !organizationId) {
      setError("Pick or create an organization so teams know who's running this.");
      return;
    }
    if (step.key === "schedule" && !pickedDate) {
      setError("Select a start date.");
      return;
    }
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    setError(null);
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setDirection(-1);
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0 });
  }

  function jumpTo(index: number) {
    if (index >= stepIndex) return;
    setError(null);
    setDirection(-1);
    setStepIndex(index);
    window.scrollTo({ top: 0 });
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

  function onInvalid() {
    setError("Fix the highlighted fields before publishing.");
  }

  const summaryRows: { label: string; value: string; step: number }[] = [
    { label: "Organization", value: organizationId ? "Selected" : "Missing", step: 0 },
    { label: "Format", value: format === "single_elimination" ? "Knockout cup" : "League table", step: 1 },
    { label: "Field", value: `${maxTeams} teams · ${teamSize}-a-side`, step: 1 },
    { label: "Entry fee", value: entryFee > 0 ? `₱${entryFee} per team` : "Free entry", step: 2 },
    { label: "Venue", value: values.venue_name?.trim() || "—", step: 3 },
    {
      label: "Kickoff",
      value: pickedDate ? `${fnsFormat(pickedDate, "EEE, MMM d")} · ${formatTime12h(startTime)}` : "—",
      step: 3,
    },
  ];

  return (
    <div className="min-h-[100dvh] rondo-page pb-56">
      {/* ── Header: back + step progress rail ── */}
      <header className="sticky top-0 z-40 rondo-glass-nav border-b border-[var(--stroke)] px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex h-12 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-hi)]"
              aria-label={stepIndex === 0 ? "Leave" : "Previous step"}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="rondo-label text-[var(--gold)]">Tournament builder</p>
              <h1 className="rondo-title truncate text-[var(--ink-hi)]">
                {String(stepIndex + 1).padStart(2, "0")} · {step.label}
              </h1>
            </div>
          </div>
          <div className="mt-2 flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1} aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1 flex-1 rounded-[var(--r-pill)] transition-colors duration-300 ${
                  i <= stepIndex ? "bg-[var(--gold)]" : "bg-[var(--bg-inset)]"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="mx-auto max-w-lg overflow-x-clip px-4 pt-5">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step.key}
              custom={direction}
              initial={{ opacity: 0, x: 32 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direction }}
              transition={gentle}
              className="space-y-6"
            >
              {/* ════ STEP 1 · BASICS ════ */}
              {step.key === "basics" && (
                <>
                  <StepScene variant={0}>
                    <Trophy
                      size={150}
                      weight="duotone"
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 -right-6 text-[color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
                    />
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="rondo-label text-[var(--ink-low)]">{step.hint}</p>
                      <p className="mt-1 truncate font-heading text-4xl font-bold uppercase leading-none text-[var(--ink-hi)]">
                        {values.name?.trim() || "Your cup"}
                      </p>
                    </div>
                  </StepScene>

                  <div className="space-y-2">
                    <Label className={labelClass}>Tournament name</Label>
                    <input {...register("name")} placeholder="Rondo Summer Cup" autoFocus className={rondoFieldClass} />
                    {errors.name ? (
                      <FieldError message={errors.name.message} />
                    ) : (
                      <p className={hintClass}>Shows on the card and the registration page.</p>
                    )}
                  </div>

                  <OrganizationPicker
                    value={organizationId}
                    onChange={setOrganizationId}
                    onReady={setOrganizationsReady}
                  />

                  {/* Cover */}
                  <div className="space-y-2">
                    <Label className={labelClass}>Cover</Label>
                    {coverPreview ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)]">
                        <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0%_0_0_/_0.5)] to-transparent" />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview(null);
                            setCoverSampleUrl(null);
                          }}
                          aria-label="Remove cover"
                          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--bg-page)_70%,transparent)] text-[var(--ink-hi)] backdrop-blur-sm"
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] bg-[color-mix(in_oklch,var(--bg-page)_70%,transparent)] px-4 rondo-meta font-bold text-[var(--ink-hi)] backdrop-blur-sm"
                        >
                          <ImageIcon size={14} /> Change
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
                        <div className="flex items-center gap-3">
                          {SAMPLE_COVERS.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => applySampleCover(s.src)}
                              className="group flex flex-col items-center gap-1"
                            >
                              <span className="block h-12 w-20 overflow-hidden rounded-[var(--r-sm)] border border-[var(--stroke)] transition-colors group-hover:border-[var(--gold)]">
                                <img src={s.src} alt={s.label} className="h-full w-full object-cover" />
                              </span>
                              <span className="rondo-label text-[var(--ink-low)] transition-colors group-hover:text-[var(--gold)]">
                                {s.label}
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--bg-inset)] px-4 rondo-meta font-bold text-[var(--ink-hi)]"
                          >
                            <ImageIcon size={16} />
                            Upload
                          </button>
                        </div>
                        <p className={hintClass}>Optional. A sample scene works fine too.</p>
                      </div>
                    )}
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
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Story and rules</Label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      maxLength={2000}
                      placeholder="Prizes, registration rules, schedule flow, refund policy..."
                      className={`${rondoFieldClass} min-h-28 resize-none py-3`}
                    />
                    <p className={hintClass}>Optional. Captains read this before they register.</p>
                  </div>
                </>
              )}

              {/* ════ STEP 2 · FORMAT ════ */}
              {step.key === "format" && (
                <>
                  <StepScene variant={1}>
                    <Strategy
                      size={150}
                      weight="duotone"
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 -right-6 text-[color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
                    />
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="rondo-label text-[var(--ink-low)]">{step.hint}</p>
                      <p className="mt-1 font-heading text-4xl font-bold uppercase leading-none text-[var(--ink-hi)]">
                        {format === "single_elimination" ? "Knockout" : "League"}
                      </p>
                      <p className="mt-2 rondo-meta text-[var(--ink-mid)] tabular-nums">
                        {maxTeams || 0} teams · {teamSize || 0}-a-side · {totalPlayers || 0} players max
                      </p>
                    </div>
                  </StepScene>

                  <div className="grid gap-3">
                    {(
                      [
                        {
                          value: "single_elimination",
                          title: "Knockout cup",
                          note: "Fast bracket, high pressure, clear champion. Draws aren't allowed.",
                          diagram: <MiniBracket />,
                        },
                        {
                          value: "round_robin",
                          title: "League table",
                          note: "Everyone plays everyone. Fairer ranking, more football.",
                          diagram: <MiniTable />,
                        },
                      ] as const
                    ).map((option) => {
                      const selected = format === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue("format", option.value)}
                          aria-pressed={selected}
                          className={`min-h-11 rounded-[var(--r-md)] border p-4 text-left transition-colors duration-200 active:scale-[0.98] ${
                            selected
                              ? "border-[var(--gold)] bg-[var(--gold-dim)]"
                              : "border-[var(--stroke)] bg-[var(--bg-surface)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="rondo-title text-[var(--ink-hi)]">{option.title}</p>
                              <p className="mt-1 rondo-meta text-[var(--ink-mid)]">{option.note}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              {selected && <Check size={20} className="text-[var(--gold)]" aria-hidden />}
                              {option.diagram}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className={labelClass}>Teams</Label>
                      <input {...register("max_teams")} type="number" min={2} max={64} inputMode="numeric" className={rondoFieldClass} />
                      <FieldError message={errors.max_teams?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Players per side</Label>
                      <input {...register("team_size")} type="number" min={1} max={11} inputMode="numeric" className={rondoFieldClass} />
                      <FieldError message={errors.team_size?.message} />
                    </div>
                  </div>
                </>
              )}

              {/* ════ STEP 3 · MONEY ════ */}
              {step.key === "money" && (
                <>
                  <StepScene gold>
                    <CoinVertical
                      size={150}
                      weight="duotone"
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 -right-6 text-[color-mix(in_oklch,var(--gold)_16%,transparent)]"
                    />
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="rondo-label text-[var(--ink-low)]">Gross entry if the field fills</p>
                      <p className="mt-1 font-heading text-5xl font-bold leading-none tabular-nums text-[var(--gold)]">
                        ₱{prizePoolHint || 0}
                      </p>
                      <p className="mt-2 rondo-meta text-[var(--ink-mid)] tabular-nums">
                        {entryFee > 0 ? `₱${entryFee} × ${maxTeams} teams` : "Free entry tournament"}
                      </p>
                    </div>
                  </StepScene>

                  <div className="space-y-2">
                    <Label className={labelClass}>Entry fee per team (₱)</Label>
                    <input {...register("entry_fee")} type="number" min={0} step="50" inputMode="numeric" className={rondoFieldClass} />
                    {errors.entry_fee ? (
                      <FieldError message={errors.entry_fee.message} />
                    ) : (
                      <p className={hintClass}>Set to 0 for a free tournament. You collect fees; Rondo just does the math.</p>
                    )}
                  </div>
                </>
              )}

              {/* ════ STEP 4 · SCHEDULE ════ */}
              {step.key === "schedule" && (
                <>
                  <StepScene variant={2}>
                    <MapPin
                      size={150}
                      weight="duotone"
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 -right-6 text-[color-mix(in_oklch,var(--ink-hi)_8%,transparent)]"
                    />
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="rondo-label text-[var(--ink-low)]">{step.hint}</p>
                      <p className="mt-1 truncate font-heading text-4xl font-bold uppercase leading-none text-[var(--ink-hi)]">
                        {values.venue_name?.trim() || "Pick a venue"}
                      </p>
                      <p className="mt-2 truncate rondo-meta text-[var(--ink-mid)]">
                        {pickedDate ? `${fnsFormat(pickedDate, "EEE, MMM d")} · ${formatTime12h(startTime)}` : "Date TBD"}
                      </p>
                    </div>
                  </StepScene>

                  <div className="space-y-2">
                    <Label className={labelClass}>Venue name</Label>
                    <input {...register("venue_name")} placeholder="Sparta Futsal Arena" className={rondoFieldClass} />
                    <FieldError message={errors.venue_name?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Address</Label>
                    <div className="relative" ref={suggestionsRef}>
                      <input
                        value={addressInput}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Start typing an address..."
                        className={`${rondoFieldClass} pr-10`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {addressLoading && <Spinner size={16} className="animate-spin text-[var(--ink-low)]" aria-hidden />}
                      </div>
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-[var(--r-sm)] border border-[var(--stroke)] bg-[var(--bg-inset)]">
                          {suggestions.map((s, i) => {
                            const parts = s.display_name.split(",");
                            return (
                              <button
                                key={i}
                                type="button"
                                className="flex w-full items-start gap-3 border-b border-[var(--stroke)] px-4 py-3 text-left last:border-0 hover:bg-[var(--bg-surface)]"
                                onMouseDown={() => selectSuggestion(s)}
                              >
                                <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden />
                                <span className="min-w-0">
                                  <span className="block truncate rondo-body font-bold text-[var(--ink-hi)]">
                                    {parts.slice(0, 2).join(",").trim()}
                                  </span>
                                  <span className="mt-0.5 block truncate rondo-meta text-[var(--ink-low)]">
                                    {parts.slice(2, 4).join(",").trim()}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className={hintClass}>Optional but helps out-of-town teams find you.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Start date</Label>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker((v) => !v)}
                      className="flex min-h-12 w-full items-center justify-between rounded-[var(--r-sm)] bg-[var(--bg-inset)] px-4 text-left rondo-body font-bold text-[var(--ink-hi)]"
                    >
                      {pickedDate ? fnsFormat(pickedDate, "EEEE, MMMM d, yyyy") : "Tap to pick a date"}
                      <CalendarBlank size={16} className="text-[var(--gold)]" aria-hidden />
                    </button>
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
                    {!pickedDate && <FieldError message={errors.starts_date?.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Kickoff time</Label>
                    <button
                      type="button"
                      onClick={() => setShowTimePicker((v) => !v)}
                      className="flex min-h-12 w-full items-center justify-between rounded-[var(--r-sm)] bg-[var(--bg-inset)] px-4 text-left rondo-body font-bold text-[var(--ink-hi)]"
                    >
                      {formatTime12h(startTime)}
                      <CalendarBlank size={16} className="text-[var(--gold)]" aria-hidden />
                    </button>
                    <input type="hidden" {...register("starts_time")} />
                    {showTimePicker && <DrumRollPicker value={startTime} onChange={handleTimeChange} />}
                  </div>
                </>
              )}

              {/* ════ STEP 5 · REVIEW ════ */}
              {step.key === "review" && (
                <>
                  <div className="space-y-2">
                    <p className={labelClass}>This is what players will see</p>
                    <div className="pointer-events-none select-none" aria-hidden="true">
                      <TournamentCard tournament={previewTournament} href="#" />
                    </div>
                  </div>

                  <section className="rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)]">
                    {summaryRows.map((row) => (
                      <button
                        key={row.label}
                        type="button"
                        onClick={() => jumpTo(row.step)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-[var(--stroke)] px-4 py-3 text-left last:border-b-0"
                      >
                        <span className="rondo-label text-[var(--ink-low)]">{row.label}</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate rondo-body font-bold text-[var(--ink-hi)]">{row.value}</span>
                          <PencilSimple size={14} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                        </span>
                      </button>
                    ))}
                  </section>

                  <div className="flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-4">
                    <CheckCircle size={20} weight="duotone" className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden />
                    <p className="rondo-meta text-[var(--ink-mid)]">
                      Publishing opens registration. Captains can register their teams right away, and you can
                      add teams yourself from the manage screen.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--live)] bg-[color-mix(in_oklch,var(--live)_10%,transparent)] px-4 py-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-[var(--r-pill)] bg-[var(--live)]" />
                  <p className="rondo-meta text-[var(--ink-hi)]">{error}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Fixed action bar in the thumb zone ── */}
        <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-lg px-4 pb-2">
          {isReview ? (
            <button
              type="submit"
              disabled={isSubmitting || !organizationsReady}
              className="rondo-btn rondo-btn-primary min-h-12 w-full disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish tournament"}
              <Trophy size={18} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="rondo-btn rondo-btn-primary min-h-12 w-full"
            >
              Continue
              <span className="rondo-meta font-bold text-[color-mix(in_oklch,var(--gold-ink)_70%,transparent)]">
                {stepIndex + 1} / {STEPS.length}
              </span>
            </button>
          )}
        </div>
      </form>

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
