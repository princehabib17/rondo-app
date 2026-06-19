import { createClient } from "@supabase/supabase-js";

type ServiceClient = ReturnType<typeof createClient>;

/**
 * Service-role client for trusted server operations (webhooks only).
 * Bypasses RLS — never import from client components.
 * Cached as a module-level singleton; stateless so safe to reuse across requests.
 */
let _serviceClient: ServiceClient | null = null;

export function createServiceClient(): ServiceClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  _serviceClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceClient;
}
