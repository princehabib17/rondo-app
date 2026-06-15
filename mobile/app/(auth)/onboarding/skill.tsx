import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as q from '../../../lib/queries';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';
import type { SkillLevel } from '../../../lib/types';

const SKILL_MAP: Record<string, SkillLevel> = {
  beginner: 'beginner',
  casual: 'intermediate',
  intermediate: 'advanced',
  competitive: 'pro',
};

const LEVELS = [
  { id: 'beginner', label: 'Beginner', emoji: '🌱' },
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'intermediate', label: 'Intermediate', emoji: '⚡' },
  { id: 'competitive', label: 'Competitive', emoji: '🏆' },
];

const FORMATS = ['3v3', '5v5', '7v7', '11v11'];

export default function SkillScreen() {
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState<string | null>(null);
  const [preferredFormats, setPreferredFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleFormat = (f: string) => {
    Haptics.selectionAsync();
    setPreferredFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleFinish = async () => {
    if (!level) return;
    setLoading(true);
    setError('');
    try {
      await q.updateProfile({ skill_level: SKILL_MAP[level], game_preference: 'both' });
      router.replace('/(tabs)/feed');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, styles.progressDotActive]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <Text style={styles.title}>Your play style</Text>
        <Text style={styles.subtitle}>Help us show you the right games.</Text>

        {/* Skill level — Headspace: horizontal scroll pills, big tap targets */}
        <Text style={styles.sectionTitle}>Skill level</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <TouchableOpacity
                key={l.id}
                onPress={() => { Haptics.selectionAsync(); setLevel(l.id); }}
                activeOpacity={0.8}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={styles.pillEmoji}>{l.emoji}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{l.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Preferred formats */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Preferred formats</Text>
        <View style={styles.formatRow}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => toggleFormat(f)}
              style={[styles.formatPill, preferredFormats.includes(f) && styles.formatPillActive]}
            >
              <Text style={[styles.formatText, preferredFormats.includes(f) && styles.formatTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button onPress={handleFinish} disabled={!level || loading} loading={loading} size="lg">
          Let's Play
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg },

  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: { height: 4, flex: 1, borderRadius: 99, backgroundColor: colors.surfaceElevated },
  progressDotActive: { backgroundColor: colors.yellow },

  stepLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },

  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },

  /* Headspace-style horizontal scroll pills */
  pillsScroll: { gap: spacing.sm, paddingRight: spacing.lg },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minWidth: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  pillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  pillEmoji: { fontSize: 32 },
  pillLabel: { ...font.bodyMed, color: colors.textSecondary },
  pillLabelActive: { color: colors.yellow },

  formatRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  formatPill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  formatPillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  formatText: { ...font.bodyMed, color: colors.textSecondary },
  formatTextActive: { color: colors.yellow },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  errorText: { ...font.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
});
