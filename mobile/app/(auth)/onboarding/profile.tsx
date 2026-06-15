import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import { supabase } from '../../../lib/supabase';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) return null;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl ?? null;
    } catch {
      // Non-blocking: proceed without an avatar if upload fails.
      return null;
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) { setNameError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const patch: { full_name: string; avatar_url?: string } = { full_name: name.trim() };
      if (photo) {
        const avatarUrl = await uploadAvatar(photo);
        if (avatarUrl) patch.avatar_url = avatarUrl;
      }
      await q.updateProfile(patch);
      router.push({ pathname: '/(auth)/onboarding/location', params: { role, name, username, photo: photo ?? '' } });
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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i <= 1 && styles.progressDotActive]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>Step 2 of 4</Text>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Other players will see this when you join a game.</Text>

        {/* Photo picker */}
        <TouchableOpacity onPress={pickPhoto} style={styles.photoPicker} activeOpacity={0.8}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoHint}>Add photo</Text>
            </View>
          )}
          {photo && (
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditText}>Edit</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.fields}>
          <Input
            label="Full name"
            placeholder="e.g. Juan dela Cruz"
            value={name}
            onChangeText={(t) => { setName(t); setNameError(''); }}
            error={nameError}
            autoCapitalize="words"
          />
          <Input
            label="Username (optional)"
            placeholder="e.g. juandc"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            prefix={<Text style={{ color: colors.textMuted, ...font.body }}>@</Text>}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button onPress={handleContinue} disabled={!name.trim() || loading} loading={loading} size="lg" style={styles.btn}>
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg },

  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: { height: 4, flex: 1, borderRadius: 99, backgroundColor: colors.surfaceElevated },
  progressDotActive: { backgroundColor: colors.yellow },

  stepLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },

  photoPicker: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoIcon: { fontSize: 28 },
  photoHint: { ...font.captionMed, color: colors.textMuted },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  photoEditText: { ...font.captionMed, color: colors.bg },

  fields: { gap: spacing.md, marginBottom: spacing.xl },

  errorText: { ...font.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.md },

  btn: {},
});
