import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';

const { width } = Dimensions.get('window');

type Role = 'player' | 'organizer';

const ROLES = [
  {
    id: 'player' as Role,
    emoji: '⚽',
    title: 'Player',
    description: 'Find games, join teams, track your stats.',
    gradient: ['#1A2A1A', '#0A0A0A'] as [string, string],
    accent: colors.success,
  },
  {
    id: 'organizer' as Role,
    emoji: '🏟️',
    title: 'Organizer',
    description: 'Host games, run tournaments, grow your community.',
    gradient: ['#1A1A2A', '#0A0A0A'] as [string, string],
    accent: colors.accent,
  },
];

export default function RoleScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleSelect = (role: Role) => {
    Haptics.selectionAsync();
    setSelected(role);
  };

  const handleContinue = () => {
    if (!selected) return;
    router.push({ pathname: '/(auth)/onboarding/profile', params: { role: selected } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressDot, i === 0 && styles.progressDotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>You can switch roles anytime from your profile.</Text>

        <View style={styles.cards}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => handleSelect(role.id)}
              activeOpacity={0.85}
              style={[styles.card, selected === role.id && { borderColor: role.accent, borderWidth: 2 }]}
            >
              <LinearGradient colors={role.gradient} style={styles.cardGradient}>
                <Text style={styles.cardEmoji}>{role.emoji}</Text>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDesc}>{role.description}</Text>
                {selected === role.id && (
                  <View style={[styles.checkmark, { backgroundColor: role.accent }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button onPress={handleContinue} disabled={!selected} size="lg" style={styles.btn}>
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  progressRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: {
    height: 4,
    flex: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  progressDotActive: { backgroundColor: colors.yellow },

  content: { flex: 1 },
  stepLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...font.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },

  cards: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardGradient: { padding: spacing.lg, minHeight: 140 },
  cardEmoji: { fontSize: 36, marginBottom: spacing.sm },
  cardTitle: { ...font.h3, color: colors.text, marginBottom: spacing.xs },
  cardDesc: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: colors.bg, fontWeight: '700', fontSize: 14 },

  btn: { marginTop: spacing.lg },
});
