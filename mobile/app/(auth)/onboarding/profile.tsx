import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, spacing } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; username?: string; photo?: string }>();
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await q.updateProfile({ full_name: name.trim() });
      router.push({
        pathname: '/(auth)/onboarding/location',
        params: { role: params.role ?? '', name: name.trim() },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <OnboardingStepHeader step={6} onBack={() => router.back()} />
        <Text style={styles.title} accessibilityRole="header">
          What’s your name?
        </Text>
        <Text style={styles.subtitle}>Other players will see this when you join a game.</Text>

        <Input
          label="Full name"
          placeholder="e.g. Juan dela Cruz"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setNameError('');
          }}
          error={nameError}
          autoCapitalize="words"
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button onPress={handleContinue} disabled={!name.trim() || loading} loading={loading} size="lg" style={styles.next}>
            Next
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 28, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  error: { ...font.caption, color: colors.error, textAlign: 'center', marginTop: spacing.md },
  footer: { flex: 1, justifyContent: 'flex-end' },
  next: { width: '100%', borderRadius: 9999 },
});
