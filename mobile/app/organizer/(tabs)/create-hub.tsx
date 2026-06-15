import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';

export default function CreateHubScreen() {
  const insets = useSafeAreaInsets();

  const options = [
    { icon: '⚽', title: 'New Game', desc: 'Set up a futsal or football match', route: '/organizer/create/index', gradient: ['#1A2A1A', '#0A1A0A'] as [string, string], accent: colors.success },
    { icon: '🏆', title: 'New Tournament', desc: 'Run a knockout or league tournament', route: '/organizer/create/tournament', gradient: ['#1A1400', '#0A0A00'] as [string, string], accent: colors.yellow },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
        <Text style={styles.headerSub}>What are you hosting?</Text>
      </View>

      <View style={styles.options}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.title}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(o.route as any); }}
            activeOpacity={0.85}
            style={[styles.option, shadow.card]}
          >
            <LinearGradient colors={o.gradient} style={styles.optionGradient}>
              <Text style={styles.optionIcon}>{o.icon}</Text>
              <Text style={styles.optionTitle}>{o.title}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
              <View style={[styles.optionArrow, { backgroundColor: o.accent + '22', borderColor: o.accent + '44' }]}>
                <Text style={[styles.optionArrowText, { color: o.accent }]}>Get started →</Text>
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
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xs },
  headerTitle: { ...font.h1, color: colors.text },
  headerSub: { ...font.body, color: colors.textSecondary },
  options: { paddingHorizontal: spacing.lg, gap: spacing.md },
  option: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  optionGradient: { padding: spacing.xl, gap: spacing.md },
  optionIcon: { fontSize: 48 },
  optionTitle: { ...font.h2, color: colors.text },
  optionDesc: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  optionArrow: { alignSelf: 'flex-start', borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, marginTop: spacing.xs },
  optionArrowText: { ...font.bodySmMed },
});
