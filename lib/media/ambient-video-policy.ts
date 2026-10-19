/** Wait for first paint + fonts before competing for bandwidth with the hero clip. */
export const AMBIENT_VIDEO_DELAY_MS = 2500;

export type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

/** Skip the ~2MB ambient clip on save-data or 2G — poster still shows. */
export function shouldSkipAmbientVideo(
  connection?: NetworkInformationLike | null
): boolean {
  return Boolean(
    connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g"
  );
}
