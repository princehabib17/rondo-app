"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Your own profile lives on the Profile tab, where the tab bar stays put.
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.id === id) router.replace("/profile");
      });
  }, [id, router]);

  return <ProfileScreen id={id} />;
}
