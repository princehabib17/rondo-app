import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just getting started — learning the basics.', emoji: '🌱' },
  { id: 'casual', label: 'Casual', desc: 'I play for fun a few times a month.', emoji: '😊' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I play regularly and know my way around.', emoji: '⚡' },
  { id: 'competitive', label: 'Competitive', desc: 'I play to win — leagues, tournaments, the works.', emoji: '🏆' },
];

const FORMATS = ['3v3', '5v5', '7v7', '11v11'];

export default function SkillScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [level, setLevel] = useState<string | null>(null);
  const [preferredFormats, setPreferredFormats] = useState<string[]>([]);

  const toggleFormat = (f: string) => {
    Haptics.selectionAsync();
    setPreferredFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleFinish = () => {
    // Save to Supabase profile here
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, styles.progressDotActive]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <Text style={styles.title}>Your play style</Text>
        <Text style={styles.subtitle}>Help us show you the right games. You can update this anytime.</Text>

        {/* Skill level */}
        <Text style={styles.sectionTitle}>Skill level</Text>
        <View style={styles.levels}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.id}
              onPress={() => { Haptics.selectionAsync(); setLevel(l.id); }}
              activeOpacity={0.8}
              style={[styles.levelCard, level === l.id && styles.levelCardActive]}
            >
              <Text style={styles.levelEmoji}>{l.emoji}</Text>
              <View style={styles.levelText}>
                <Text style={[styles.levelLabel, level === l.id && styles.levelLabelActive]}>{l.label}</Text>
                <Text style={styles.levelDesc}>{l.desc}</Text>
              </View>
              {level === l.id && (
                <View style={styles.levelCheck}>
                  <Text style={styles.levelCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferred formats */}
        <Text style={styles.sectionTitle}>Preferred formats</Text>
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
        <Button onPress={handleFinish} size="lg" style={styles.btn}>
          Let's Play
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: { height: 4, flex: 1, borderRadius: 99, backgroundColor: colors.surfaceElevated },
  progressDotActive: { backgroundColor: colors.yellow },

  stepLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },

  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },

  levels: { gap: spacing.sm, marginBottom: spacing.xl },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  levelCardActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  levelEmoji: { fontSize: 28 },
  levelText: { flex: 1 },
  levelLabel: { ...font.bodyMed, color: colors.textSecondary, marginBottom: 2 },
  levelLabelActive: { color: colors.yellow },
  levelDesc: { ...font.caption, color: colors.textMuted, lineHeight: 18 },
  levelCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCheckText: { color: colors.bg, fontWeight: '800', fontSize: 12 },

  formatRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xl },
  formatPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  formatPillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  formatText: { ...font.bodySmMed, color: colors.textSecondary },
  formatTextActive: { color: colors.yellow },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  btn: {},
});
