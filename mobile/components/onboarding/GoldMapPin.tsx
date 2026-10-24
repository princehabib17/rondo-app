import React from 'react';
import { Image } from 'expo-image';

/* eslint-disable @typescript-eslint/no-require-imports */
const PIN = require('../../assets/onboarding/gold-pin.png');
/* eslint-enable @typescript-eslint/no-require-imports */

/** The 3D gold map pin used on the location step. */
export function GoldMapPin({ size = 160 }: { size?: number }) {
  return (
    <Image
      source={PIN}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Location pin"
    />
  );
}
