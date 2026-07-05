import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestUser } from "@/lib/auth/is-guest";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/otp",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

const PUBLIC_PREFIXES = [
  "/api/payments/webhook",
  "/api/auth/guest",
  "/api/auth/signup",
  "/api/seed",
];

const PUBLIC_BROWSE_PREFIXES = [
  "/feed",
  "/scout",
  "/tournaments",
  "/organizers",
];

/** Public routes that do not need a Supabase session lookup (faster dev loads). */
const PUBLIC_SKIP_AUTH = [
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/onboarding",
  "/feed",
];

const GUEST_BLOCKED_PREFIXES = [
  "/my-games",
  "/wallet",
  "/organizer",
];

const GUEST_BLOCKED_SUFFIXES = [
  "/join",
  "/payment",
  "/chat",
  "/room",
  "/confirmed",
  "/invite",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (
    PUBLIC_BROWSE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  if (pathname.startsWith("/profile/")) {
    return true;
  }
  if (pathname.startsWith("/games/")) {
    return !GUEST_BLOCKED_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
  }
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Avoid hanging requests when Supabase auth is slow or unreachable. */
async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  ms = 3000
) {
  const result = await Promise.race([
    supabase.auth.getUser(),
    new Promise<{ data: { user: null }; error: null }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: null }), ms)
    ),
  ]);
  return result.data.user;
}

function isPublicSkipAuth(pathname: string): boolean {
  return PUBLIC_SKIP_AUTH.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  // Guard: if Supabase env vars are missing (e.g. preview deployments without secrets),
  // pass through rather than crashing the middleware with a 500.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  if (isPublicSkipAuth(pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const user = await getUserWithTimeout(supabase);

  if (!user && !isPublicRoute(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === "/" || pathname === "/login" || pathname === "/signup") &&
    !isGuestUser(user)
  ) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (isGuestUser(user)) {
    const isBlockedByPrefix = GUEST_BLOCKED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    const isBlockedBySuffix = GUEST_BLOCKED_SUFFIXES.some((suffix) =>
      pathname.endsWith(suffix)
    );

    if (isBlockedByPrefix || isBlockedBySuffix) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Create an account to continue" }, { status: 403 });
      }
      const signupUrl = new URL("/signup", request.url);
      signupUrl.searchParams.set("next", pathname);
      signupUrl.searchParams.set("guest", "1");
      return NextResponse.redirect(signupUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
