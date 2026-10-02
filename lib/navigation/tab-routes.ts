/**
 * Tab roots are the screens the bottom nav switches between. Everything else
 * is a pushed screen: it owns a back button and the bottom edge (for its own
 * action bar), so the tab bar steps aside, the way native apps behave.
 */
const TAB_ROOTS = new Set([
  "/feed",
  "/feed/map",
  "/community",
  "/my-games",
  "/tournaments",
  "/profile",
  "/organizer/dashboard",
  "/organizer/tournaments",
  "/organizer/room",
]);

export function isTabRoot(pathname: string): boolean {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return TAB_ROOTS.has(clean);
}
