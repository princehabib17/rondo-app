import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import { writeOnboardingDraft } from '../../../lib/onboarding-draft';
import { GENDER_OPTIONS, type Gender } from '../../../lib/gender';

export default function GenderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    role?: string;
    username?: string;
    photo?: string;
    dob?: string;
  }>();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Gender | null>(() => {
    const existing = profile?.gender;
    return GENDER_OPTIONS.some((o) => o.value === existing) ? (existing as Gender) : null;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await writeOnboardingDraft({ gender: selected });
      if (profile?.id) {
        await q.updateProfile({ gender: selected });
      }
      router.push({
        pathname: '/(auth)/onboarding/location',
        params: {
          role: params.role ?? '',
          username: params.username ?? '',
          photo: params.photo ?? '',
          dob: params.dob ?? '',
          gender: selected,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your gender. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <OnboardingStepHeader step={4} onBack={() => router.back()} />

      <Text style={styles.title} accessibilityRole="header">
        What&apos;s your gender?
      </Text>
      <Text style={styles.subtitle}>Helps organizers balance sides and show the right open games.</Text>

      <View style={styles.options} accessibilityRole="radiogroup">
        {GENDER_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(option.value);
                setError('');
              }}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <Button
          onPress={() => void handleContinue()}
          disabled={!selected || saving}
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
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  options: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  option: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionActive: {
    borderColor: colors.yellow,
    backgroundColor: 'rgba(245, 198, 66, 0.12)',
  },
  optionPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  optionLabel: { ...font.body, fontWeight: '600', color: colors.text, fontSize: 16 },
  optionLabelActive: { color: colors.text },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    borderColor: colors.yellow,
    backgroundColor: colors.yellow,
  },
  checkMark: { color: colors.bg, fontWeight: '700', fontSize: 13, marginTop: -1 },
  error: { ...font.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  footer: { justifyContent: 'flex-end' },
  next: { width: '100%', borderRadius: 9999 },
});
