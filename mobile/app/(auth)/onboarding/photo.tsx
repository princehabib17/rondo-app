import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import { supabase } from '../../../lib/supabase';

const CROP: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export default function PhotoScreen() {
  const insets = useSafeAreaInsets();
  const { role, username } = useLocalSearchParams<{ role?: string; username?: string }>();
  const { user, profile } = useAuth();
  const reduceMotion = useReducedMotion();
  const [photo, setPhoto] = useState<string | null>(profile?.avatar_url ?? null);
  const [permError, setPermError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const applyAsset = (uri: string) => {
    setPhoto(uri);
    setPermError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deniedMessage = (kind: 'camera' | 'library') =>
    kind === 'camera'
      ? 'Allow camera access to take a profile photo.'
      : 'Allow photo access to pick from your camera roll.';

  const handleDenied = async (kind: 'camera' | 'library', canAskAgain: boolean) => {
    setPermError(deniedMessage(kind));
    if (!canAskAgain && Platform.OS !== 'web' && typeof Linking.openSettings === 'function') {
      try {
        await Linking.openSettings();
      } catch {
        // Settings deep link is native-only.
      }
    }
  };

  const pickFromLibrary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      await handleDenied('library', perm.canAskAgain);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(CROP);
    if (!result.canceled && result.assets[0]?.uri) applyAsset(result.assets[0].uri);
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      await handleDenied('camera', perm.canAskAgain);
      return;
    }
    const result = await ImagePicker.launchCameraAsync(CROP);
    if (!result.canceled && result.assets[0]?.uri) applyAsset(result.assets[0].uri);
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user?.id) return null;
    const res = await fetch(uri);
    const arrayBuffer = await res.arrayBuffer();
    const path = `${user.id}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
  };

  const goNext = (photoUri: string) => {
    router.push({
      pathname: '/(auth)/onboarding/birthday',
      params: { role: role ?? '', username: username ?? '', photo: photoUri },
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    setSaveError('');
    try {
      if (photo && photo !== profile?.avatar_url) {
        const avatarUrl = await uploadAvatar(photo);
        if (avatarUrl) await q.updateProfile({ avatar_url: avatarUrl });
      }
      goNext(photo ?? '');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save that photo. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <OnboardingStepHeader step={3} onBack={() => router.back()} />

      <Text style={styles.title} accessibilityRole="header">
        Choose your profile picture
      </Text>
      <Text style={styles.subtitle}>Your profile picture will be visible on your profile.</Text>

      <View style={styles.hero}>
        <Pressable
          onPress={pickFromLibrary}
          accessibilityLabel={photo ? 'Change profile photo' : 'Add a profile photo'}
          style={({ pressed }) => [styles.avatarHit, pressed && styles.pressed]}
        >
          {photo ? (
            <Animated.View
              key={photo}
              entering={reduceMotion ? undefined : ZoomIn.duration(200).easing(Easing.bezier(0.23, 1, 0.32, 1))}
            >
              <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
            </Animated.View>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.head} />
              <View style={styles.shoulders} />
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeGlyph}>📷</Text>
          </View>
        </Pressable>

        {photo ? (
          <Animated.Text
            key="looking-good"
            entering={reduceMotion ? undefined : FadeIn.duration(200).easing(Easing.bezier(0.23, 1, 0.32, 1))}
            style={styles.lookingGood}
          >
            Looking good!
          </Animated.Text>
        ) : (
          <Text style={styles.addLabel}>Add a profile photo</Text>
        )}
      </View>

      {photo ? null : (
        <Text style={styles.cropHint}>After you pick one, crop it to a square so it fits your avatar.</Text>
      )}

      <Pressable onPress={pickFromLibrary} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowIcon}>🖼</Text>
        <Text style={styles.rowLabel}>Pick an image from camera roll</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable onPress={takePhoto} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowIcon}>📷</Text>
        <Text style={styles.rowLabel}>Take Photo</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {permError ? (
        <Pressable onPress={() => Linking.openSettings()} style={styles.permBox}>
          <Text style={styles.permText}>{permError}</Text>
          {Platform.OS !== 'web' ? <Text style={styles.permLink}>Open Settings</Text> : null}
        </Pressable>
      ) : null}
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

      <View style={styles.footer}>
        <Button onPress={handleContinue} loading={saving} size="lg" style={styles.next}>
          Next
        </Button>
      </View>
    </View>
  );
}

const AVATAR = 168;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24 },

  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg },
  avatarHit: { width: AVATAR, height: AVATAR },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: colors.surfaceHigh },
  placeholder: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  head: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  shoulders: {
    width: 120,
    height: 54,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: colors.border,
  },
  badge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  badgeGlyph: { fontSize: 16 },
  addLabel: { ...font.h4, color: colors.text, marginTop: spacing.md },
  lookingGood: { ...font.h4, color: colors.yellow, marginTop: spacing.md },

  cropHint: {
    ...font.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { ...font.bodyMed, color: colors.text, flex: 1 },
  chevron: { color: colors.textMuted, fontSize: 22, fontWeight: '300' },

  permBox: { marginTop: spacing.sm, gap: spacing.xs },
  permText: { ...font.caption, color: colors.error, textAlign: 'center' },
  permLink: { ...font.captionMed, color: colors.yellow, textAlign: 'center' },
  saveError: { ...font.caption, color: colors.error, textAlign: 'center', marginTop: spacing.sm },

  footer: { flex: 1, justifyContent: 'flex-end' },
  next: { width: '100%', borderRadius: radius.full },
});
