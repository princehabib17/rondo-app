import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, spacing } from '../../constants/theme';
import { JOIN_TOTAL_STEPS } from '../../lib/onboarding-draft';

export function OnboardingStepHeader({
  step,
  totalSteps = JOIN_TOTAL_STEPS,
  onBack,
}: {
  step: number;
  totalSteps?: number;
  onBack: () => void;
}) {
  const fill = Math.min(1, Math.max(0, step / totalSteps));

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        <Text style={styles.backGlyph}>←</Text>
      </Pressable>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalSteps, now: step }}
        accessibilityLabel={`Step ${step} of ${totalSteps}`}
      >
        <View style={[styles.fill, { width: `${fill * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  backGlyph: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: -1 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.yellow,
    borderRadius: radius.full,
  },
});
