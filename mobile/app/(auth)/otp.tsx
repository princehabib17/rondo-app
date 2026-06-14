import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { colors, font, spacing, radius } from '../../constants/theme';

const CODE_LENGTH = 6;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDigit = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (token: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone!,
      token,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Incorrect code. Try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      router.replace('/(auth)/onboarding/role');
    }
  };

  const resend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    await supabase.auth.signInWithOtp({ phone: phone! });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.title}>Enter code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </View>

        {/* Code boxes */}
        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.digitBox,
                digit && styles.digitBoxFilled,
                error && styles.digitBoxError,
              ]}
            >
              <TextInput
                ref={(r) => { inputRefs.current[i] = r; }}
                value={digit}
                onChangeText={(v) => handleDigit(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.digitInput}
                caretHidden
              />
              {!digit && <View style={styles.cursor} />}
            </View>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && <Text style={styles.verifying}>Verifying…</Text>}

        {/* Resend */}
        <TouchableOpacity onPress={resend} style={styles.resendBtn} disabled={countdown > 0}>
          <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.wrongNumber}>
          <Text style={styles.wrongNumberText}>Wrong number?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  back: { marginBottom: spacing.xl },
  backArrow: { fontSize: 24, color: colors.yellow },

  heading: { marginBottom: spacing.xxl },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 26 },
  phone: { color: colors.yellow, fontWeight: '600' },

  codeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  digitBox: {
    flex: 1,
    height: 64,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFilled: { borderColor: colors.yellow },
  digitBoxError: { borderColor: colors.error },
  digitInput: {
    ...font.h2,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 28,
    backgroundColor: colors.yellow,
    borderRadius: 1,
  },

  error: { ...font.bodySmMed, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  verifying: { ...font.bodySmMed, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },

  resendBtn: { alignItems: 'center', marginBottom: spacing.md },
  resend: { ...font.bodySmMed, color: colors.yellow },
  resendDisabled: { color: colors.textMuted },

  wrongNumber: { alignItems: 'center' },
  wrongNumberText: { ...font.bodySm, color: colors.textMuted },
});
