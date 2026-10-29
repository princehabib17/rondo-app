import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { DateWheelFrame, WheelColumn } from '../../../components/onboarding/DateWheel';
import { colors, font, spacing } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import { writeOnboardingDraft } from '../../../lib/onboarding-draft';
import {
  MONTHS,
  defaultBirthParts,
  daysInMonth,
  fromIsoDate,
  isOldEnough,
  toIsoDate,
  yearRange,
  clampBirthParts,
  type BirthParts,
} from '../../../lib/date-of-birth';

export default function BirthdayScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; username?: string; photo?: string }>();
  const { profile } = useAuth();
  const years = useMemo(() => {
    const { min, max } = yearRange();
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, []);
  const yearLabels = useMemo(() => years.map(String), [years]);

  const [parts, setParts] = useState<BirthParts>(() => {
    const stored = profile?.date_of_birth ? fromIsoDate(profile.date_of_birth) : null;
    return clampBirthParts(stored ?? defaultBirthParts());
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dayCount = daysInMonth(parts.year, parts.month);
  const dayLabels = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => String(i + 1)),
    [dayCount]
  );

  const valid = isOldEnough(parts);

  const patch = (next: Partial<BirthParts>) => {
    setError('');
    setParts((prev) => {
      const merged = { ...prev, ...next };
      const max = daysInMonth(merged.year, merged.month);
      if (merged.day > max) merged.day = max;
      return merged;
    });
  };

  const handleContinue = async () => {
    if (!valid) {
      setError('You must be at least 13 to join Rondo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const date_of_birth = toIsoDate(parts);
      await writeOnboardingDraft({ birthdate: date_of_birth });
      if (profile?.id) {
        await q.updateProfile({ date_of_birth });
      }
      router.push({
        pathname: '/(auth)/onboarding/gender',
        params: {
          role: params.role ?? '',
          username: params.username ?? '',
          photo: params.photo ?? '',
          dob: date_of_birth,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your birthday. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <OnboardingStepHeader step={3} onBack={() => router.back()} />

      <Text style={styles.title} accessibilityRole="header">
        When were you born?
      </Text>
      <Text style={styles.subtitle}>Your age will be visible on your profile.</Text>

      <View style={styles.wheelWrap}>
        <DateWheelFrame>
          <WheelColumn
            accessibilityLabel="Month"
            flex={1.4}
            items={MONTHS}
            index={parts.month}
            onIndexChange={(month) => patch({ month })}
          />
          <WheelColumn
            accessibilityLabel="Day"
            flex={0.7}
            items={dayLabels}
            index={parts.day - 1}
            onIndexChange={(i) => patch({ day: i + 1 })}
          />
          <WheelColumn
            accessibilityLabel="Year"
            flex={0.9}
            items={yearLabels}
            index={Math.max(0, years.indexOf(parts.year))}
            onIndexChange={(i) => patch({ year: years[i] })}
          />
        </DateWheelFrame>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <Button
          onPress={() => void handleContinue()}
          disabled={!valid || saving}
          loading={saving}
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
  title: { ...font.h1, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24 },
  wheelWrap: { flex: 1, justifyContent: 'center' },
  error: { ...font.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  footer: { justifyContent: 'flex-end', gap: spacing.md },
  next: { width: '100%', borderRadius: 9999 },
});
