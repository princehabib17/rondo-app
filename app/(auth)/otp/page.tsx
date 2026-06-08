"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [cooldown, setCooldown] = useState(60);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setCooldown(60);
    setResent(true);
  }

  return (
    <div className="space-y-8 text-center">
      <div className="pt-2">
        <Image src="/rondo-logo.png" alt="RONDO" width={48} height={48} priority className="mx-auto object-contain" />
      </div>

      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        <Mail size={36} className="text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-white font-black italic text-3xl tracking-tight">CHECK YOUR EMAIL</h1>
        <p className="text-muted-foreground text-sm">We sent a confirmation link to</p>
        <p className="text-white font-semibold text-sm">{email || "your email"}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Click the link to activate your account. Check your spam folder if it doesn&apos;t show up.
        </p>
      </div>

      {resent && <p className="text-primary text-sm font-medium">Email resent!</p>}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
        </button>
        <Link href="/login" className="block text-muted-foreground text-sm hover:text-white transition-colors">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}
