import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingStepHeader } from '../../../components/onboarding/OnboardingStepHeader';
import { colors, font, radius, spacing } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import {
  searchCountries,
  flagEmojiFromCode,
  findCountry,
  type Country,
} from '../../../lib/countries';

export default function CountryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    role?: string;
    username?: string;
    photo?: string;
    dob?: string;
  }>();
  const { profile } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const existing = findCountry(profile?.nationality);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Country | null>(existing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const results = useMemo(() => searchCountries(query), [query]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const handleCancel = () => {
    if (query) {
      setQuery('');
      return;
    }
    Keyboard.dismiss();
    router.back();
  };

  const handleSelect = async (country: Country) => {
    if (saving) return;
    setSelected(country);
    setSaving(true);
    setError('');
    Haptics.selectionAsync();
    try {
      await q.updateProfile({ nationality: country.code });
      router.push({
        pathname: '/(auth)/onboarding/profile',
        params: {
          role: params.role ?? '',
          username: params.username ?? '',
          photo: params.photo ?? '',
          dob: params.dob ?? '',
          nationality: country.code,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your country. Try again.');
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.pad}>
        <OnboardingStepHeader step={5} onBack={() => router.back()} />
        <Text style={styles.title} accessibilityRole="header">
          Where are you from?
        </Text>
        <Text style={styles.subtitle}>Your flag shows on your avatar.</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchPill}>
            <Text style={styles.searchGlyph}>🔍</Text>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setError('');
              }}
              placeholder="Search here"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search countries"
            />
            {query ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityLabel="Clear search"
                style={styles.clearHit}
              >
                <Text style={styles.clear}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={handleCancel}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No countries match “{query.trim()}”.</Text>
        }
        renderItem={({ item }) => {
          const active = selected?.code === item.code;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              disabled={saving}
              style={({ pressed }) => [
                styles.row,
                active && styles.rowActive,
                pressed && styles.rowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.flag}>{flagEmojiFromCode(item.code)}</Text>
              <Text style={[styles.name, active && styles.nameActive]}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: spacing.lg },
  title: { ...font.h1, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.lg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  searchPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  searchGlyph: { fontSize: 14 },
  searchInput: { flex: 1, minWidth: 0, ...font.body, color: colors.text, paddingVertical: 0 },
  clearHit: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: { color: colors.bg, fontSize: 10, fontWeight: '700', marginTop: -1 },
  cancel: { ...font.bodyMed, color: colors.textSecondary, paddingLeft: 2 },
  error: {
    ...font.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: 56 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  rowActive: { backgroundColor: colors.yellowDim },
  rowPressed: { backgroundColor: colors.surface },
  flag: { fontSize: 22, width: 32, textAlign: 'center' },
  name: { ...font.body, color: colors.text, flex: 1 },
  nameActive: { color: colors.yellow, fontWeight: '600' },
  empty: {
    ...font.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
