import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, spacing, radius } from '../../../constants/theme';
import {
  JOIN_TOTAL_STEPS,
  readOnboardingDraft,
  writeOnboardingDraft,
} from '../../../lib/onboarding-draft';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void readOnboardingDraft().then((d) => setEnabled(d.notificationsEnabled));
  }, []);

  const enableNotifications = async () => {
    setAsking(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Soft opt-in until expo-notifications is wired for push delivery.
      // On web, try the browser Notification API when present.
      if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
        const result = await Notification.requestPermission();
        const ok = result === 'granted';
        await writeOnboardingDraft({ notificationsEnabled: ok });
        setEnabled(ok);
        if (!ok) setError('Notifications were not enabled. You can turn them on later.');
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await writeOnboardingDraft({ notificationsEnabled: true });
        setEnabled(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError('Could not request notification permission.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <OnboardingStepHeader step={5} totalSteps={JOIN_TOTAL_STEPS} onBack={() => router.back()} />

      <Text style={styles.title} accessibilityRole="header">
        Enable notifications
      </Text>
      <Text style={styles.subtitle}>
        We&apos;ll send you notifications about games you&apos;ve joined, messages from other players,
        and more.
      </Text>

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>🔔</Text>
        </View>
      </View>

      {enabled ? (
        <View style={styles.banner}>
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Notifications Enabled</Text>
            <Text style={styles.bannerBody}>
              You will receive game invites, chat updates, and important match alerts.
            </Text>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        {!enabled ? (
          <Button
            onPress={enableNotifications}
            disabled={asking}
            loading={asking}
            size="lg"
            variant="secondary"
            style={styles.next}
          >
            Enable notifications
          </Button>
        ) : null}
        <Button
          onPress={() => router.push('/(auth)/signup')}
          size="lg"
          style={styles.next}
        >
          Next
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 28, color: colors.text, marginBottom: spacing.sm },
  subtitle: {
    ...font.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  hero: { alignItems: 'center', paddingVertical: spacing.xxl },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 72 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.bg, fontWeight: '800', fontSize: 14 },
  bannerTitle: { ...font.bodyMed, color: colors.text, marginBottom: 2 },
  bannerBody: { ...font.caption, color: colors.textSecondary, lineHeight: 18 },
  error: { ...font.caption, color: colors.error, textAlign: 'center', marginTop: spacing.md },
  footer: { flex: 1, justifyContent: 'flex-end', gap: spacing.md },
  next: { width: '100%', borderRadius: radius.full },
});
