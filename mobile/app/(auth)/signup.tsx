import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, font, spacing, radius } from '../../constants/theme';

const COUNTRY_CODE = '+63'; // Philippines default

type SignupMode = 'phone' | 'email';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<SignupMode>('phone');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handlePhoneContinue = async () => {
    if (!phone || phone.length < 9) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    const fullPhone = `${COUNTRY_CODE}${phone.replace(/^0/, '')}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
    } else {
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    }
  };

  const handleEmailContinue = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) {
      setError('Enter your name');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: trimmedName } },
    });

    if (!signUpError && data.session) {
      setLoading(false);
      router.replace('/(auth)/onboarding/role');
      return;
    }

    if (!signUpError && data.user && !data.session) {
      setLoading(false);
      setInfo('Account created. Check your email to confirm, then sign in.');
      return;
    }

    // Existing account — try sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signUpError?.message ?? signInError.message);
      return;
    }
    router.replace('/(tabs)/feed');
  };

  const handleContinue = () => {
    if (mode === 'email') {
      void handleEmailContinue();
      return;
    }
    void handlePhoneContinue();
  };

  const handleApple = () => {
    // Apple Sign In — requires native setup
  };

  const handleGoogle = () => {
    // Google OAuth
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.title}>Join Rondo</Text>
          <Text style={styles.subtitle}>
            {mode === 'phone'
              ? 'Connect with games and players near you.'
              : 'Optional: create an account with email and password.'}
          </Text>
        </View>

        <View style={styles.socialGroup}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.socialBtn} onPress={handleApple} activeOpacity={0.8}>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialLabel}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} activeOpacity={0.8}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialLabel}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
            onPress={() => {
              setMode('phone');
              setError('');
              setInfo('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
            onPress={() => {
              setMode('email');
              setError('');
              setInfo('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>Email</Text>
          </TouchableOpacity>
        </View>

        {mode === 'phone' ? (
          <View style={styles.phoneGroup}>
            <Text style={styles.phoneLabel}>Phone number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇵🇭</Text>
                <Text style={styles.code}>{COUNTRY_CODE}</Text>
              </View>
              <Input
                containerStyle={{ flex: 1 }}
                placeholder="9XX XXX XXXX"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  setError('');
                }}
                error={error}
                maxLength={11}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        ) : (
          <View style={styles.emailGroup}>
            <Input
              label="Full name"
              placeholder="Juan dela Cruz"
              autoCapitalize="words"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setError('');
              }}
            />
            <Input
              label="Email"
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError('');
              }}
            />
            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {info ? <Text style={styles.infoText}>{info}</Text> : null}
          </View>
        )}

        <Button onPress={handleContinue} loading={loading} size="lg" style={styles.continueBtn}>
          {mode === 'phone' ? 'Send Code' : 'Create account'}
        </Button>

        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg },

  back: { marginBottom: spacing.xl },
  backArrow: { fontSize: 24, color: colors.yellow },

  heading: { marginBottom: spacing.xl },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24 },

  socialGroup: { gap: spacing.sm, marginBottom: spacing.lg },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  socialIcon: { fontSize: 18, fontWeight: '700', color: colors.text },
  socialLabel: { ...font.bodyMed, color: colors.text },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...font.caption, color: colors.textMuted },

  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  modeText: {
    ...font.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  modeTextActive: { color: colors.bg },

  phoneGroup: { marginBottom: spacing.md, gap: spacing.xs },
  phoneLabel: { ...font.label, color: colors.textSecondary },
  phoneRow: { flexDirection: 'row', gap: 0 },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  flag: { fontSize: 18 },
  code: { ...font.bodyMed, color: colors.text },
  errorText: { ...font.caption, color: colors.error },
  infoText: { ...font.caption, color: colors.success },

  emailGroup: { marginBottom: spacing.md, gap: spacing.md },

  continueBtn: { marginTop: spacing.sm },

  terms: { ...font.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  link: { color: colors.yellow },
});
