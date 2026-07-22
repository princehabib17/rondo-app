"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanFace, Trash2 } from "lucide-react";
import {
  deletePasskey,
  isPasskeySupported,
  listPasskeys,
  registerPasskey,
  type PasskeyInfo,
} from "@/lib/auth/passkey";

function formatPasskeyDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PasskeyManager() {
  const [supported, setSupported] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await listPasskeys();
    if (!result.ok) {
      setError(result.error);
      setPasskeys([]);
      return;
    }
    setError(null);
    setPasskeys(result.data);
  }, []);

  useEffect(() => {
    const ok = isPasskeySupported();
    setSupported(ok);
    if (!ok) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function handleRegister() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await registerPasskey();
    setBusy(false);

    if (!result.ok) {
      if (!result.cancelled) setError(result.error);
      return;
    }

    setMessage("Passkey added. You can use Face ID, Touch ID, or your device unlock next time.");
    await refresh();
  }

  async function handleDelete(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await deletePasskey(id);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Passkey removed.");
    await refresh();
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-1">
        <p className="text-sm text-white/80 font-medium">Passkeys</p>
        <p className="text-xs text-muted-foreground leading-snug">
          This browser doesn&apos;t support biometric passkeys. Try Safari, Chrome, or Edge on a
          device with Face ID, Touch ID, or Windows Hello.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-white/5 p-2 text-rondo-accent">
          <ScanFace size={18} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 font-medium">Passkeys</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            Sign in with Face ID, Touch ID, Windows Hello, or a security key — no password needed.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading passkeys...</p>
      ) : passkeys.length === 0 ? (
        <p className="text-xs text-muted-foreground">No passkeys on this account yet.</p>
      ) : (
        <ul className="space-y-2">
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-black/20 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-white/85 truncate">
                  {pk.friendly_name?.trim() || "Passkey"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Added {formatPasskeyDate(pk.created_at)}
                  {pk.last_used_at ? ` · Last used ${formatPasskeyDate(pk.last_used_at)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(pk.id)}
                disabled={busy}
                aria-label={`Remove ${pk.friendly_name?.trim() || "passkey"}`}
                className="shrink-0 p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleRegister}
        disabled={busy || loading}
        className="w-full border border-border text-muted-foreground hover:text-white hover:border-border/80 text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
      >
        {busy ? "Waiting for biometric..." : "Add passkey"}
      </button>

      {message && <p className="text-xs text-rondo-accent text-center">{message}</p>}
      {error && (
        <p className="text-xs text-red-400 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
