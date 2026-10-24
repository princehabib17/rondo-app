export const DRUM_ROW_HEIGHT = 46;
export const DRUM_VISIBLE_ROWS = 7;
export const DRUM_HEIGHT = DRUM_ROW_HEIGHT * DRUM_VISIBLE_ROWS;

/** Row sitting in the selection band for a given scroll offset. */
export function drumIndexFromScroll(scrollTop: number, count: number, rowHeight = DRUM_ROW_HEIGHT): number {
  if (count <= 0) return 0;
  const raw = Math.round(scrollTop / rowHeight);
  return Math.min(count - 1, Math.max(0, raw));
}

/**
 * Cylinder look for a row `distance` rows away from the centre (fractional while scrolling):
 * rows tilt away, shrink and fade toward the top and bottom like the iOS picker.
 */
export function drumRowStyle(distance: number): { rotateX: number; opacity: number; scale: number } {
  const d = Math.max(-3.5, Math.min(3.5, distance));
  const abs = Math.abs(d);
  return {
    rotateX: -d * 21,
    opacity: Math.max(0.12, 1 - abs * 0.26),
    scale: Math.max(0.78, 1 - abs * 0.06),
  };
}
