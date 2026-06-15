import { supabase } from './supabase';

// Base URL of the Next.js backend (the existing web app's API routes).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Call a Next.js API route with the current Supabase access token as a Bearer.
 * The web `createClient()` reads this header to authenticate mobile requests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(json?.error ?? `Request failed (${res.status})`, res.status, json?.code, json);
  }
  return json as T;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, status: number, code?: string, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function idempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Wallet payment for a game (service-role RPC behind the route) ──
export async function payGameWithWallet(gameId: string, teamId: string | null) {
  return apiFetch<{ status: string; balanceCentavos: number }>('/api/wallet/pay-game', {
    method: 'POST',
    body: JSON.stringify({ gameId, teamId, idempotencyKey: idempotencyKey() }),
  });
}

// ── Wallet top-up via PayMongo checkout ───────────────────────
export async function startWalletTopup(amountCentavos: number) {
  return apiFetch<{ checkoutUrl: string }>('/api/wallet/topup/checkout', {
    method: 'POST',
    body: JSON.stringify({ amountCentavos }),
  });
}

// ── Online game payment via PayMongo checkout ─────────────────
export async function startGameCheckout(gameId: string, teamId: string | null) {
  return apiFetch<{ checkoutUrl: string }>('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ gameId, teamId }),
  });
}
