import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';

const OPTIONS = [
  {
    mark: '5V5',
    title: 'Host a match',
    desc: 'A fast setup for one game: cover, venue, teams, pricing, then publish.',
    route: '/organizer/create/index',
    colors: ['#20220B', '#070707'] as [string, string],
    accent: colors.yellow,
  },
  {
    mark: 'CUP',
    title: 'Build a tournament',
    desc: 'A guided cup builder with bracket format, venue story, team size, and review.',
    route: '/organizer/create/tournament',
    colors: ['#101F1A', '#050505'] as [string, string],
    accent: colors.accent,
  },
];

export default function CreateHubScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Organizer studio</Text>
        <Text style={styles.title}>What are you launching?</Text>
        <Text style={styles.subtitle}>Choose the journey first. Details come after the concept is clear.</Text>
      </View>

      <View style={styles.stack}>
        {OPTIONS.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              router.push(item.route as any);
            }}
            activeOpacity={0.86}
            style={[styles.shell, index === 0 && styles.heroShell, shadow.card]}
          >
            <LinearGradient colors={item.colors} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.mark, { borderColor: item.accent + '66' }]}>
                  <Text style={[styles.markText, { color: item.accent }]}>{item.mark}</Text>
                </View>
                <View style={[styles.signal, { backgroundColor: item.accent }]} />
              </View>

              <View style={styles.pitch}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>

              <View style={[styles.action, { backgroundColor: item.accent }]}>
                <Text style={styles.actionText}>Start</Text>
                <Text style={styles.actionIcon}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    ...font.captionMed,
    color: colors.yellow,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...font.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
    maxWidth: 310,
  },
  stack: { paddingHorizontal: spacing.lg, gap: spacing.md },
  shell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  heroShell: { minHeight: 244 },
  card: {
    minHeight: 220,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mark: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.glass,
  },
  markText: { ...font.captionMed, letterSpacing: 1.2 },
  signal: { width: 10, height: 10, borderRadius: 5 },
  pitch: { gap: spacing.sm },
  cardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
    textTransform: 'uppercase',
    lineHeight: 34,
  },
  cardDesc: { ...font.bodySm, color: colors.textSecondary, lineHeight: 20 },
  action: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionText: {
    ...font.bodySmMed,
    color: colors.bg,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  actionIcon: { color: colors.bg, fontSize: 18, fontWeight: '900' },
});
