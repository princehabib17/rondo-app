"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RondoPage } from "@/components/rondo/primitives";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace(`/profile/${data.user.id}`);
      else router.replace("/login");
    });
  }, [router]);

  return (
    <RondoPage className="flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-rondo-accent animate-spin" aria-label="Loading profile" />
    </RondoPage>
  );
}
