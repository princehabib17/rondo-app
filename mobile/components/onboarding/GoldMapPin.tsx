import React from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/** 3D gold map pin — same silhouette as the pickup location step. */
export function GoldMapPin({ size = 160 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityLabel="Location pin">
      <Defs>
        <LinearGradient id="body" x1="18%" y1="8%" x2="88%" y2="96%">
          <Stop offset="0" stopColor="#FFF3A8" />
          <Stop offset="0.28" stopColor="#F0D85A" />
          <Stop offset="0.62" stopColor="#D4B12A" />
          <Stop offset="1" stopColor="#9A7A12" />
        </LinearGradient>
        <RadialGradient id="shine" cx="34%" cy="24%" r="46%">
          <Stop offset="0" stopColor="#FFFBE6" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#F0D85A" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="hole" x1="30%" y1="10%" x2="70%" y2="90%">
          <Stop offset="0" stopColor="#5C4A10" />
          <Stop offset="1" stopColor="#1A1608" />
        </LinearGradient>
      </Defs>
      <Path
        d="M80 150C80 150 28 98 28 64C28 35.3 51.3 12 80 12C108.7 12 132 35.3 132 64C132 98 80 150 80 150Z"
        fill="url(#body)"
      />
      <Path
        d="M80 150C80 150 28 98 28 64C28 35.3 51.3 12 80 12C108.7 12 132 35.3 132 64C132 98 80 150 80 150Z"
        fill="url(#shine)"
      />
      <Ellipse cx="80" cy="58" rx="22" ry="21" fill="url(#hole)" />
    </Svg>
  );
}
