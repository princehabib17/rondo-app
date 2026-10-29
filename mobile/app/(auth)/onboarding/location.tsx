import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { GoldMapPin } from '../../../components/onboarding/GoldMapPin';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import { writeOnboardingDraft } from '../../../lib/onboarding-draft';
import { requestDeviceLocation } from '../../../lib/device-location';

type Gps = { lat: number; lng: number };

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const reduceMotion = useReducedMotion();

  const [gps, setGps] = useState<Gps | null>(() =>
    profile?.last_lat != null && profile?.last_lng != null
      ? { lat: profile.last_lat, lng: profile.last_lng }
      : null
  );
  const [area, setArea] = useState(profile?.preferred_areas ?? '');
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ready = !!gps || area.trim().length >= 2;

  const enableGps = async () => {
    if (asking) return;
    setAsking(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await requestDeviceLocation();
    setAsking(false);
    if (result.ok) {
      setGps({ lat: result.lat, lng: result.lng });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (result.reason === 'denied') {
      setError('Allow location access, or type an area below.');
      // openSettings is native-only; calling it on web throws (not a rejected promise).
      if (Platform.OS !== 'web' && typeof Linking.openSettings === 'function') {
        try {
          await Linking.openSettings();
        } catch {
          // Player can still type an area.
        }
      }
      return;
    }
    setError('Could not read your location. Type an area instead.');
  };

  const handleNext = async () => {
    setSaving(true);
    setError('');
    try {
      await writeOnboardingDraft({
        locationEnabled: !!gps,
        lastLat: gps?.lat ?? null,
        lastLng: gps?.lng ?? null,
        preferredAreas: area.trim(),
      });
      if (profile?.id && ready) {
        const patch: Parameters<typeof q.updateProfile>[0] = {};
        if (gps) {
          patch.last_lat = gps.lat;
          patch.last_lng = gps.lng;
          patch.location_hidden = false;
        }
        if (area.trim()) patch.preferred_areas = area.trim();
        if (Object.keys(patch).length) await q.updateProfile(patch);
      }
      router.push({ pathname: '/(auth)/onboarding/notifications', params });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your location. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const entering = reduceMotion ? undefined : FadeIn.duration(180).easing(Easing.bezier(0.23, 1, 0.32, 1));
  const zoom = reduceMotion ? undefined : ZoomIn.duration(220).easing(Easing.bezier(0.23, 1, 0.32, 1));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <OnboardingStepHeader step={5} onBack={() => router.back()} />

        <Text style={styles.title} accessibilityRole="header">
          Enable location
        </Text>
        <Text style={styles.subtitle}>
          We need your location to show you games nearby. You can either enable location services or manually enter a location near you.
        </Text>

        <View style={styles.hero}>
          <View pointerEvents="none" style={[styles.ring, styles.ringOuter]} />
          <View pointerEvents="none" style={[styles.ring, styles.ringMid]} />
          <View pointerEvents="none" style={[styles.ring, styles.ringInner]} />
          <Pressable
            onPress={enableGps}
            disabled={asking || !!gps}
            accessibilityRole="button"
            accessibilityLabel="Enable location"
            style={({ pressed }) => [styles.pinHit, pressed && !gps && styles.pinPressed]}
          >
            <GoldMapPin size={160} />
          </Pressable>
        </View>

        {gps ? (
          <Animated.View entering={zoom} style={styles.successPill}>
            <View style={styles.successDot}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>Location enabled!</Text>
              <Text style={styles.successSub}>We can show nearby games.</Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={entering} style={styles.manual}>
            <Pressable onPress={enableGps} disabled={asking} style={styles.enableLink}>
              <Text style={styles.enableLinkText}>{asking ? 'Finding you…' : 'Enable location services'}</Text>
            </Pressable>
            <Input
              placeholder="Or type an area, e.g. BGC"
              value={area}
              onChangeText={(t) => {
                setArea(t);
                setError('');
              }}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Area near you"
            />
          </Animated.View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button onPress={handleNext} disabled={saving} loading={saving} size="lg" style={styles.next}>
            Next
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const RING = 280;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 28, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24 },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RING,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(232,210,74,0.18)',
    backgroundColor: 'rgba(232,210,74,0.05)',
  },
  ringOuter: { width: RING, height: RING },
  ringMid: { width: 210, height: 210, backgroundColor: 'rgba(232,210,74,0.07)' },
  ringInner: { width: 150, height: 150, backgroundColor: 'rgba(232,210,74,0.1)' },
  pinHit: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pinPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  manual: { gap: spacing.md, marginBottom: spacing.md },
  enableLink: { alignItems: 'center', paddingVertical: spacing.xs },
  enableLinkText: { ...font.bodyMed, color: colors.yellow },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  successDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: { color: colors.success, fontSize: 16, fontWeight: '700' },
  successCopy: { flex: 1, gap: 2 },
  successTitle: { ...font.bodyMed, color: colors.text },
  successSub: { ...font.caption, color: colors.textSecondary },
  error: { ...font.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
  footer: { justifyContent: 'flex-end' },
  next: { width: '100%', borderRadius: 9999 },
});
