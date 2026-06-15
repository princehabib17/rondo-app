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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneContinue = async () => {
    if (!phone || phone.length < 9) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    const fullPhone = `${COUNTRY_CODE}${phone.replace(/^0/, '')}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    }
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
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Join Rondo</Text>
          <Text style={styles.subtitle}>Connect with games and players near you.</Text>
        </View>

        {/* Social login — Apple first on iOS */}
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Phone */}
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
              onChangeText={(t) => { setPhone(t); setError(''); }}
              error={error}
              maxLength={11}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <Button onPress={handlePhoneContinue} loading={loading} size="lg" style={styles.continueBtn}>
          Send Code
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

  continueBtn: { marginTop: spacing.sm },

  terms: { ...font.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  link: { color: colors.yellow },
});
