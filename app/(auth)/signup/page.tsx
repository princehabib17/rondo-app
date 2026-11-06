"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { rememberJoinDestination } from "@/lib/onboarding/intent";

/** Legacy signup entry: retain the requested action through the join flow. */
export default function SignupRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    rememberJoinDestination(new URLSearchParams(window.location.search).get("next"));
    router.replace("/onboarding/slides");
  }, [router]);
  return <p role="status">Opening signup…</p>;
}
