"use client";

import { useEffect, useState } from "react";
import { ScanFace } from "lucide-react";
import { isPasskeySupported, signInWithPasskey } from "@/lib/auth/passkey";
import { RondoButton } from "@/components/rondo/primitives";

type PasskeySignInButtonProps = {
  onSuccess: (userId: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function PasskeySignInButton({
  onSuccess,
  onError,
  disabled,
}: PasskeySignInButtonProps) {
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(isPasskeySupported());
  }, []);

  if (!supported) return null;

  async function handleClick() {
    if (loading || disabled) return;
    setLoading(true);
    const result = await signInWithPasskey();
    setLoading(false);

    if (!result.ok) {
      if (!result.cancelled) onError?.(result.error);
      return;
    }

    await onSuccess(result.data.userId);
  }

  return (
    <RondoButton
      type="button"
      variant="secondary"
      disabled={disabled || loading}
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2"
    >
      <ScanFace size={18} aria-hidden />
      {loading ? "Waiting for biometric..." : "Sign in with passkey"}
    </RondoButton>
  );
}
