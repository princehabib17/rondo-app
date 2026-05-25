import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Creates a one-time guest account when anonymous sign-in is disabled.
 * Returns credentials for the client to sign in with password.
 */
export async function POST() {
  try {
    const service = createServiceClient();
    const id = crypto.randomUUID().slice(0, 8);
    const email = `guest.${id}@guest.rondo.app`;
    const password = crypto.randomUUID().replace(/-/g, "") + "Aa1!";

    const { data: userData, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Guest", is_guest: true },
    });

    if (createError || !userData.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create guest account" },
        { status: 500 }
      );
    }

    await service.from("profiles").upsert({
      id: userData.user.id,
      email,
      full_name: "Guest",
      role: "player",
    });

    return NextResponse.json({ email, password });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Guest sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
