"use client";

import { useRouter } from "next/navigation";

type ContinueAsGuestProps = {
  className?: string;
};

export function ContinueAsGuest({ className }: ContinueAsGuestProps) {
  const router = useRouter();

  function handleContinue() {
    document.cookie = "rondo_guest=1; Path=/; Max-Age=604800; SameSite=Lax";
    router.push("/feed");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleContinue} className={className}>
      Continue as Guest
    </button>
  );
}
