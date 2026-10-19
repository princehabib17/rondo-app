import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, spacing, radius } from '../../../constants/theme';
import * as q from '../../../lib/queries';
import { useAuth } from '../../../hooks/useAuth';
import { writeOnboardingDraft } from '../../../lib/onboarding-draft';
import {
  USERNAME_MAX_LENGTH,
  isReservedUsername,
  normalizeUsername,
  sanitizeUsernameInput,
  usernameRuleStates,
} from '../../../lib/username';

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'error';

const CHECK_MS = 400;

export default function UsernameScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { profile } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const checkSeq = useRef(0);

  const [value, setValue] = useState(profile?.username ?? '');
  const [availability, setAvailability] = useState<Availability>('idle');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const rules = usernameRuleStates(value);
  const rulesOk = rules.every((r) => r.met);
  const canContinue = rulesOk && availability === 'available' && !saving;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (profile?.username) {
      setValue((current) => current || profile.username!);
    }
  }, [profile?.username]);

  useEffect(() => {
    if (!value) {
      setAvailability('idle');
      return;
    }
    if (isReservedUsername(value)) {
      setAvailability('reserved');
      return;
    }
    if (!rulesOk) {
      setAvailability('idle');
      return;
    }

    const seq = ++checkSeq.current;
    setAvailability('checking');
    const t = setTimeout(async () => {
      try {
        const taken = await q.isUsernameTaken(normalizeUsername(value));
        if (checkSeq.current !== seq) return;
        setAvailability(taken ? 'taken' : 'available');
        if (taken) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        if (checkSeq.current !== seq) return;
        setAvailability('error');
      }
    }, CHECK_MS);
    return () => clearTimeout(t);
  }, [value, rulesOk]);

  const onChangeText = (next: string) => {
    setSaveError('');
    setValue(sanitizeUsernameInput(next));
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    setSaveError('');
    try {
      const username = normalizeUsername(value);
      await writeOnboardingDraft({ username });
      // If already signed in (returning mid-flow), persist immediately.
      if (profile?.id) {
        try {
          await q.updateProfile({ username });
        } catch (e) {
          const message = e instanceof Error ? e.message : '';
          const taken =
            message.toLowerCase().includes('duplicate') ||
            message.toLowerCase().includes('unique');
          if (taken) {
            setAvailability('taken');
            return;
          }
        }
      }
      router.push({ pathname: '/(auth)/onboarding/photo', params: { role, username } });
    } catch {
      setSaveError('Could not save that username. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const tone: 'idle' | 'error' | 'ok' =
    availability === 'taken' || availability === 'reserved'
      ? 'error'
      : availability === 'available'
        ? 'ok'
        : 'idle';

  const hint =
    availability === 'taken'
      ? 'Username is already taken.'
      : availability === 'reserved'
        ? 'That username is reserved.'
        : availability === 'available'
          ? 'Username is available.'
          : availability === 'error'
            ? "Couldn't check that username. Keep typing to retry."
            : 'No spaces. Letters and numbers only.';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <OnboardingStepHeader step={1} onBack={() => router.back()} />

        <Text style={styles.title} accessibilityRole="header">
          Choose your username
        </Text>
        <Text style={styles.subtitle}>This is how other players will find and recognize you.</Text>

        <View style={styles.card}>
          <View
            style={[
              styles.field,
              tone === 'error' && styles.fieldError,
              tone === 'ok' && styles.fieldOk,
            ]}
          >
            <Text style={styles.at}>@</Text>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder="username"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              spellCheck={false}
              maxLength={USERNAME_MAX_LENGTH}
              accessibilityLabel="Username"
              style={styles.input}
            />
            {tone === 'error' ? (
              <View style={[styles.status, styles.statusError]} accessibilityLabel="Unavailable">
                <Text style={styles.statusMark}>×</Text>
              </View>
            ) : null}
            {tone === 'ok' ? (
              <View style={[styles.status, styles.statusOk]} accessibilityLabel="Available">
                <Text style={styles.statusMarkOk}>✓</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <Text
              style={[
                styles.hint,
                tone === 'error' && styles.hintError,
                tone === 'ok' && styles.hintOk,
              ]}
            >
              {hint}
            </Text>
            <Text style={styles.count}>
              {value.length}/{USERNAME_MAX_LENGTH}
            </Text>
          </View>

          <View style={styles.chips}>
            {rules.map((rule) => (
              <View key={rule.id} style={[styles.chip, rule.met && styles.chipMet]}>
                <Text style={[styles.chipText, rule.met && styles.chipTextMet]}>{rule.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

        <View style={styles.footer}>
          <Button
            onPress={handleContinue}
            disabled={!canContinue}
            loading={saving}
            size="lg"
            variant={canContinue || saving ? 'primary' : 'secondary'}
            style={styles.next}
          >
            Next
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 28, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldError: {
    backgroundColor: colors.errorDim,
    borderColor: colors.error,
  },
  fieldOk: {
    backgroundColor: colors.successDim,
    borderColor: colors.success,
  },
  at: { ...font.bodyMed, color: colors.textMuted, marginRight: spacing.xs },
  input: { flex: 1, ...font.bodyMed, color: colors.text, paddingVertical: spacing.sm },

  status: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  statusError: { backgroundColor: colors.error },
  statusOk: { backgroundColor: colors.success },
  statusMark: { color: colors.white, fontWeight: '700', fontSize: 14, marginTop: -1 },
  statusMarkOk: { color: colors.bg, fontWeight: '800', fontSize: 12 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  hint: { ...font.caption, color: colors.textMuted, flex: 1 },
  hintError: { color: colors.error },
  hintOk: { color: colors.success },
  count: { ...font.caption, color: colors.textFaint },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
  },
  chipMet: { backgroundColor: colors.successDim },
  chipText: { ...font.captionMed, color: colors.textMuted },
  chipTextMet: { color: colors.success },

  saveError: { ...font.caption, color: colors.error, marginTop: spacing.md },

  footer: { flex: 1, justifyContent: 'flex-end' },
  next: { width: '100%', borderRadius: radius.full },
});
