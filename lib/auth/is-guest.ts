type MaybeGuestUser = {
  is_anonymous?: boolean;
  user_metadata?: { is_guest?: unknown } | null;
} | null | undefined;

export function isGuestUser(user: MaybeGuestUser): boolean {
  return Boolean(user?.is_anonymous || user?.user_metadata?.is_guest);
}
