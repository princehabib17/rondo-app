type MaybeUser = {
  is_anonymous?: boolean;
  user_metadata?: { is_scout?: unknown } | null;
} | null | undefined;

export function isScoutUser(user: MaybeUser): boolean {
  return Boolean(user?.is_anonymous && user?.user_metadata?.is_scout);
}
