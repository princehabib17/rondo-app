"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "player" | "organizer";

export default function RoleSelectionPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const router = useRouter();

  function handleConfirm() {
    if (!selected) return;
    // Store in sessionStorage to use during profile setup
    sessionStorage.setItem("selectedRole", selected);
    router.push("/onboarding/profile");
  }

  return (
    <div className="flex flex-col min-h-screen p-6 space-y-6">
      <h1 className="text-white font-bold text-2xl tracking-wider uppercase text-center pt-4">
        Choose Your Role
      </h1>

      <div className="flex-1 flex flex-col gap-4 justify-center">
        {/* Player Card */}
        <button
          onClick={() => setSelected("player")}
          className={cn(
            "relative rounded-xl overflow-hidden h-44 border-2 transition-all duration-200",
            selected === "player" ? "border-rondo-yellow" : "border-border"
          )}
        >
          {/* Background gradient simulating football pitch */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-black" />
          {/* Overlay pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 40px, rgba(255,255,255,0.1) 41px)",
          }} />
          <div className="relative h-full flex items-center px-6">
            <div className="text-left">
              <div className="text-5xl mb-2">⚽</div>
              <h2 className="text-white font-black text-2xl tracking-widest uppercase">Player</h2>
              <p className="text-green-300 text-sm mt-1">Find &amp; join local games</p>
            </div>
            {selected === "player" && (
              <div className="ml-auto w-8 h-8 rounded-full bg-rondo-yellow flex items-center justify-center">
                <span className="text-black font-bold text-lg">✓</span>
              </div>
            )}
          </div>
        </button>

        {/* Organizer Card */}
        <button
          onClick={() => setSelected("organizer")}
          className={cn(
            "relative rounded-xl overflow-hidden h-44 border-2 transition-all duration-200",
            selected === "organizer" ? "border-rondo-yellow" : "border-border"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
          <div className="relative h-full flex items-center px-6">
            <div className="text-left">
              <div className="text-5xl mb-2">📋</div>
              <h2 className="text-white font-black text-2xl tracking-widest uppercase">Organizer</h2>
              <p className="text-gray-300 text-sm mt-1">Create &amp; manage games</p>
            </div>
            {selected === "organizer" && (
              <div className="ml-auto w-8 h-8 rounded-full bg-rondo-yellow flex items-center justify-center">
                <span className="text-black font-bold text-lg">✓</span>
              </div>
            )}
          </div>
        </button>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider text-base py-6 hover:brightness-90 disabled:opacity-40"
      >
        Confirm Selection
      </Button>
    </div>
  );
}
