import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, font, spacing } from '../../constants/theme';

type Color = 'yellow' | 'green' | 'red' | 'blue' | 'muted';

interface Props {
  children: React.ReactNode;
  color?: Color;
  style?: ViewStyle;
}

export function Badge({ children, color = 'muted', style }: Props) {
  return (
    <View style={[styles.base, styles[color], style]}>
      <Text style={[styles.text, styles[`text_${color}`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  yellow: { backgroundColor: colors.yellowDim, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
  green: { backgroundColor: colors.successDim, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  red: { backgroundColor: colors.errorDim, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  blue: { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  muted: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },

  text: { ...font.captionMed },
  text_yellow: { color: colors.yellow },
  text_green: { color: colors.success },
  text_red: { color: colors.error },
  text_blue: { color: colors.accent },
  text_muted: { color: colors.textSecondary },
});
