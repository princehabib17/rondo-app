import type { NextConfig } from "next";
import path from "path";

/**
 * Hosts that may be optimized by next/image. User-generated media (avatars,
 * organization logos, post media) is rendered `unoptimized` so an unexpected
 * host can never throw during render; this list covers the assets we do
 * optimize: Supabase storage and OAuth provider avatars.
 */
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "**.supabase.co" },
  { protocol: "https", hostname: "**.supabase.in" },
  { protocol: "https", hostname: "**.googleusercontent.com" },
  { protocol: "https", hostname: "**.fbcdn.net" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },
];

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

// Self-hosted or custom-domain Supabase projects are not covered by the
// wildcard above; allow whatever the env points at.
if (supabaseHost && !supabaseHost.endsWith(".supabase.co")) {
  remotePatterns.push({ protocol: "https", hostname: supabaseHost });
}

const nextConfig: NextConfig = {
  // Parent folder has another package-lock.json; without this, dev can hang on Windows.
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: { remotePatterns },
};

export default nextConfig;
