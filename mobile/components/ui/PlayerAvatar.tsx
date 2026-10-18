import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, font } from '../../constants/theme';
import { getFlagEmoji } from '../../lib/countries';

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function PlayerAvatar({
  uri,
  name,
  nationality,
  size = 44,
  showFlag = true,
  borderColor,
  borderWidth = 0,
}: {
  uri?: string | null;
  name?: string | null;
  nationality?: string | null;
  size?: number;
  showFlag?: boolean;
  borderColor?: string;
  borderWidth?: number;
}) {
  const flag = showFlag ? getFlagEmoji(nationality) : '';
  const flagSize = Math.max(12, Math.round(size * 0.34));
  const fontSize = Math.max(10, Math.round(size * 0.36));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: borderColor ?? 'transparent',
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <Text style={[styles.initials, { fontSize }]}>{initials(name)}</Text>
        )}
      </View>
      {flag ? (
        <View
          pointerEvents="none"
          style={[
            styles.flagBadge,
            {
              width: flagSize + 4,
              height: flagSize + 4,
              borderRadius: (flagSize + 4) / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Text style={{ fontSize: flagSize, lineHeight: flagSize + 2 }}>{flag}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    backgroundColor: colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  initials: { ...font.bodyMed, color: colors.yellow, fontWeight: '700' },
  flagBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
});
