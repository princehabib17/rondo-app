"use client";

import Link from "next/link";
import { ContinueAsGuest } from "@/components/auth/ContinueAsGuest";
import { RondoMark } from "@/components/auth/RondoMark";

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-10 py-14">
        <div className="pt-1">
          <RondoMark className="origin-top-left scale-[0.48] items-start" />
        </div>

        <div className="flex flex-1 items-center justify-center pb-28">
          <RondoMark showWordmark />
        </div>

        <div className="mb-20 flex flex-col gap-5">
          <Link
            href="/signup"
            className="w-full rounded-xl bg-white px-6 py-5 text-center text-xl font-black uppercase tracking-tight text-black transition hover:bg-zinc-100"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="w-full rounded-xl bg-[#fff98a] px-6 py-5 text-center text-xl font-black uppercase tracking-tight text-black transition hover:brightness-95"
          >
            Log In
          </Link>
          <ContinueAsGuest className="w-full py-5 text-center text-xl font-black uppercase tracking-tight text-white transition hover:text-[#fff98a]" />
        </div>
      </div>
    </main>
  );
}
