import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/otp",
  "/forgot-password",
  "/auth/callback",
];

const PUBLIC_PREFIXES = [
  "/api/payments/webhook",
  "/api/auth/guest",
];

const GUEST_BLOCKED_PREFIXES = [
  "/my-games",
  "/profile",
  "/wallet",
  "/community",
  "/organizer",
];

const GUEST_BLOCKED_SUFFIXES = [
  "/join",
  "/payment",
  "/chat",
  "/confirmed",
  "/invite",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicRoute(pathname)) {
      return NextResponse.next({ request });
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Server misconfigured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel." },
        { status: 503 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === "/" || pathname === "/login" || pathname === "/signup") &&
    !user.is_anonymous
  ) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (user?.is_anonymous) {
    const isBlockedByPrefix = GUEST_BLOCKED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    const isBlockedBySuffix = GUEST_BLOCKED_SUFFIXES.some((suffix) =>
      pathname.endsWith(suffix)
    );

    if (isBlockedByPrefix || isBlockedBySuffix) {
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
