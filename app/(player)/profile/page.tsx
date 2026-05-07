"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace(`/profile/${data.user.id}`);
      else router.replace("/login");
    });
  }, [router]);
  return null;
}
