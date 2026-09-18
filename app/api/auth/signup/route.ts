import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { normalizeUsername, usernameValidationError } from "@/lib/auth/username";

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  let email: string, password: string, fullName: string, username: string;
  try {
    ({ email, password, fullName, username } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
  const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";
  const normalizedUsername =
    typeof username === "string" ? normalizeUsername(username) : "";

  if (!normalizedEmail || !password || !trimmedName || !normalizedUsername) {
    return NextResponse.json(
      { error: "email, password, fullName, and username are required" },
      { status: 400 }
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const usernameError = usernameValidationError(normalizedUsername);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  if (trimmedName.length < 2) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: existingUsername } = await service
    .from("profiles")
    .select("id")
    .ilike("username", normalizedUsername)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const { data, error } = await service.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: trimmedName, username: normalizedUsername },
  });

  if (error) {
    const isExisting =
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("exists");
    return NextResponse.json(
      { error: isExisting ? "An account with this email already exists." : error.message },
      { status: isExisting ? 409 : 500 }
    );
  }

  if (data.user?.id) {
    const { error: profileError } = await service.from("profiles").upsert({
      id: data.user.id,
      email: normalizedEmail,
      full_name: trimmedName,
      username: normalizedUsername,
    });
    if (profileError) {
      const taken =
        profileError.message.toLowerCase().includes("duplicate") ||
        profileError.message.toLowerCase().includes("unique");
      return NextResponse.json(
        { error: taken ? "That username is taken." : profileError.message },
        { status: taken ? 409 : 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
