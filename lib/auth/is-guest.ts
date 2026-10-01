type MaybeGuestUser = {
  is_anonymous?: boolean;
  user_metadata?: { is_guest?: unknown } | null;
} | null | undefined;

export function isGuestUser(user: MaybeGuestUser): boolean {
  return Boolean(user?.is_anonymous || user?.user_metadata?.is_guest);
}

/**
 * Login and signup should stay on screen for guests. Guest accounts are real
 * users (`is_guest`), not anonymous, so an `is_anonymous` check bounces them
 * back to the feed before they can create or enter an account.
 */
export function shouldRedirectAwayFromAuth(user: MaybeGuestUser): boolean {
  return Boolean(user) && !isGuestUser(user);
}
