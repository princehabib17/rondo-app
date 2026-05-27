/** Preset top-up amounts in centavos (PHP × 100). */
export const TOPUP_PRESETS_CENTAVOS = [
  10_000, // ₱100
  20_000, // ₱200
  50_000, // ₱500
  100_000, // ₱1,000
  200_000, // ₱2,000
  500_000, // ₱5,000
] as const;

export const MIN_TOPUP_CENTAVOS = 10_000;
export const MAX_TOPUP_CENTAVOS = 500_000;
