import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";

const GENERIC_ERROR = "Invalid username/email or password.";

/**
 * Resolves a login identifier (email or @username) to an email for
 * signInWithPassword. Always returns a generic error on miss so usernames
 * cannot be enumerated easily.
 */
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  let identifier: string;
  try {
    ({ identifier } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof identifier !== "string" || !identifier.trim()) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const raw = identifier.trim();
  const asEmail = normalizeEmail(raw);
  if (isValidEmail(asEmail)) {
    return NextResponse.json({ email: asEmail });
  }

  const username = normalizeUsername(raw);
  if (!isValidUsername(username)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("profiles")
      .select("email")
      .ilike("username", username)
      .maybeSingle();

    if (error || !data?.email) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    return NextResponse.json({ email: normalizeEmail(data.email) });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
}
