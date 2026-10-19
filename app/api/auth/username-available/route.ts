import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("u") ?? "";
  const username = normalizeUsername(raw);

  if (!isValidUsername(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Without service role, allow client to proceed; uniqueness enforced on save.
    return NextResponse.json({ available: true, reason: "unchecked" });
  }

  try {
    const service = createServiceClient();
    const { data } = await service
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    return NextResponse.json({ available: !data, reason: data ? "taken" : "ok" });
  } catch {
    return NextResponse.json({ available: true, reason: "unchecked" });
  }
}
