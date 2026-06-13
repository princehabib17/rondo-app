function getConfiguredAppOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return null;

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

export function getAppOrigin(): string {
  return getConfiguredAppOrigin() ?? window.location.origin;
}

export function getAuthCallbackUrl(next?: string): string {
  const url = new URL("/auth/callback", getAppOrigin());
  if (next) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}
