import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In real app: Location.requestForegroundPermissionsAsync()
    await new Promise((r) => setTimeout(r, 800));
    setGranted(true);
    setLoading(false);
  };

  const handleContinue = () => {
    router.push({ pathname: '/(auth)/onboarding/skill', params });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressDot, i <= 2 && styles.progressDotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
        <Text style={styles.title}>Find games near you</Text>
        <Text style={styles.subtitle}>
          Allow location access to see games and players in your area. We never share your exact location.
        </Text>

        <View style={styles.illustrationBox}>
          <Text style={styles.illustrationEmoji}>📍</Text>
          <Text style={styles.illustrationTitle}>
            {granted ? 'Location enabled!' : 'Games within 10km'}
          </Text>
          <Text style={styles.illustrationSub}>
            {granted
              ? 'We\'ll show you games and players nearby.'
              : 'Metro Manila · Quezon City · Makati'}
          </Text>
          {granted && <Text style={styles.successTick}>✓</Text>}
        </View>

        <View style={styles.benefitsList}>
          {[
            { icon: '🏟️', text: 'See games on the map instantly' },
            { icon: '👥', text: 'Discover nearby players' },
            { icon: '🔔', text: 'Get alerts for games in your area' },
          ].map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {!granted ? (
          <>
            <Button onPress={handleAllow} loading={loading} size="lg" style={styles.btn}>
              Allow Location Access
            </Button>
            <TouchableOpacity onPress={handleContinue} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Button onPress={handleContinue} size="lg" style={styles.btn}>
            Continue
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: { height: 4, flex: 1, borderRadius: 99, backgroundColor: colors.surfaceElevated },
  progressDotActive: { backgroundColor: colors.yellow },

  content: { flex: 1 },
  stepLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },

  illustrationBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  illustrationEmoji: { fontSize: 48, marginBottom: spacing.md },
  illustrationTitle: { ...font.h3, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  illustrationSub: { ...font.bodySm, color: colors.textSecondary, textAlign: 'center' },
  successTick: { fontSize: 32, marginTop: spacing.md, color: colors.success },

  benefitsList: { gap: spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { fontSize: 20, width: 32 },
  benefitText: { ...font.body, color: colors.textSecondary, flex: 1 },

  actions: { gap: spacing.sm },
  btn: {},
  skipBtn: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { ...font.bodySmMed, color: colors.textMuted },
});
