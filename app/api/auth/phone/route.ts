import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isLikelyPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone";

function phoneEmail(phone: string) {
  return `phone.${phone.replace(/\D/g, "")}@phone.rondo.app`;
}

function passwordFor(phone: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "rondo";
  return `${phone.replace(/\D/g, "")}.${secret.slice(-16)}.Aa1!`;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Phone sign-in fallback is not configured" }, { status: 503 });
  }

  let body: { phone?: string; fullName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const phone = normalizePhoneNumber(body.phone ?? "");
  if (!isLikelyPhoneNumber(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number with country code." }, { status: 400 });
  }

  const email = phoneEmail(phone);
  const password = passwordFor(phone);
  const fullName = body.fullName?.trim() || "Rondo Player";
  const service = createServiceClient();

  const existing = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }

  let user =
    existing.data.users.find(
      (candidate) =>
        candidate.email === email ||
        candidate.phone === phone ||
        candidate.user_metadata?.phone === phone
    ) ?? null;

  if (!user) {
    const created = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, auth_fallback: "phone" },
    });

    if (created.error) {
      return NextResponse.json({ error: created.error.message }, { status: 500 });
    }
    user = created.data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Could not create phone account" }, { status: 500 });
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: user.id,
    email,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? fullName,
    role: "player",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ email, password });
}
