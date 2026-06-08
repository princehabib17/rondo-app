import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  let email: string, password: string, fullName: string;
  try {
    ({ email, password, fullName } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "email, password, and fullName are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
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

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
