"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createTournamentSchema = z.object({
  name: z.string().min(3, "Name required").max(120),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "round_robin"]),
  starts_at: z.string().min(1, "Start date required"),
  venue_name: z.string().min(2, "Venue required"),
  venue_address: z.string().optional(),
  max_teams: z.coerce.number().min(2).max(64),
  team_size: z.coerce.number().min(1).max(11),
  entry_fee: z.coerce.number().min(0), // pesos in the form, centavos on the wire
});
type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

export default function CreateTournamentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<CreateTournamentForm>({
      resolver: zodResolver(createTournamentSchema) as Resolver<CreateTournamentForm>,
      defaultValues: {
        format: "single_elimination",
        max_teams: 8,
        team_size: 5,
        entry_fee: 0,
      },
    });

  const format = watch("format");

  async function onSubmit(values: CreateTournamentForm) {
    setError(null);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description || undefined,
        format: values.format,
        startsAt: new Date(values.starts_at).toISOString(),
        venueName: values.venue_name,
        venueAddress: values.venue_address || undefined,
        maxTeams: values.max_teams,
        teamSize: values.team_size,
        entryFee: Math.round(values.entry_fee * 100),
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
      <header className="sticky top-0 rondo-glass-nav border-b border-white/5 z-40 px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <button type="button" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="text-white font-black text-lg">Create Tournament</h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-4 py-5 space-y-4 max-w-lg mx-auto"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Tournament name</Label>
          <Input id="name" placeholder="Rondo Summer Cup" {...register("name")} />
          {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Format</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "single_elimination", title: "Knockout", note: "Lose once, you're out" },
                { value: "round_robin", title: "League", note: "Everyone plays everyone" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("format", option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  format === option.value
                    ? "border-rondo-accent/60 bg-rondo-accent/10"
                    : "border-white/10 bg-card"
                }`}
              >
                <p className="text-white text-sm font-bold">{option.title}</p>
                <p className="text-muted-foreground text-xs">{option.note}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="starts_at">Starts</Label>
          <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
          {errors.starts_at && <p className="text-red-400 text-xs">{errors.starts_at.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue_name">Venue</Label>
          <Input id="venue_name" placeholder="Sparta Futsal Arena" {...register("venue_name")} />
          {errors.venue_name && <p className="text-red-400 text-xs">{errors.venue_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue_address">Address (optional)</Label>
          <Input id="venue_address" placeholder="126 Pioneer St, Mandaluyong" {...register("venue_address")} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="max_teams">Max teams</Label>
            <Input id="max_teams" type="number" min={2} max={64} {...register("max_teams")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team_size">Per side</Label>
            <Input id="team_size" type="number" min={1} max={11} {...register("team_size")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entry_fee">Fee (₱/team)</Label>
            <Input id="entry_fee" type="number" min={0} step="50" {...register("entry_fee")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Rules, prizes, schedule details…"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-rondo-accent/40"
            {...register("description")}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating…" : "Create tournament"}
        </Button>
      </form>
    </div>
  );
}
