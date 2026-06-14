import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const MOCK_TEAMS = [
  { id: 'red', name: 'Team Red', color: '#EF4444', players: ['Juan', 'Mike', 'Carlo', 'Rico'], max: 5 },
  { id: 'blue', name: 'Team Blue', color: '#3B82F6', players: ['Alex', 'Ben', 'Chris', 'Dave', 'Ed'], max: 5 },
];

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (teamId: string) => {
    Haptics.selectionAsync();
    setSelected(teamId);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirming(true);
  };

  const handlePay = () => {
    router.replace(`/games/${id}/payment`);
  };

  if (confirming) {
    const team = MOCK_TEAMS.find((t) => t.id === selected)!;
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity onPress={() => setConfirming(false)} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.confirmContent}>
          <View style={[styles.confirmDot, { backgroundColor: team.color }]} />
          <Text style={styles.confirmTitle}>Join {team.name}?</Text>
          <Text style={styles.confirmSub}>
            You're about to join this game. Payment of ₱150 will be required to confirm your spot.
          </Text>

          <Card style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Team</Text>
              <Text style={styles.confirmValue}>{team.name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Game</Text>
              <Text style={styles.confirmValue}>Friday Night 5v5</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount due</Text>
              <Text style={[styles.confirmValue, { color: colors.yellow }]}>₱150</Text>
            </View>
          </Card>
        </View>

        <View style={styles.confirmActions}>
          <Button onPress={() => setConfirming(false)} variant="secondary" style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onPress={handlePay} style={{ flex: 1 }}>
            Pay & Confirm
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Handle */}
      <View style={styles.modalHandle}>
        <View style={styles.handle} />
      </View>

      <Text style={styles.title}>Choose your team</Text>
      <Text style={styles.subtitle}>Pick a team with an open slot. You can't switch after joining.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.teams}>
        {MOCK_TEAMS.map((team) => {
          const isFull = team.players.length >= team.max;
          const openSlots = team.max - team.players.length;
          const isSelected = selected === team.id;

          return (
            <TouchableOpacity
              key={team.id}
              onPress={() => !isFull && handleSelect(team.id)}
              activeOpacity={isFull ? 1 : 0.85}
              style={[
                styles.teamCard,
                isSelected && { borderColor: team.color, borderWidth: 2 },
                isFull && styles.teamCardFull,
              ]}
            >
              {/* Color bar */}
              <View style={[styles.colorBar, { backgroundColor: team.color }]} />

              <View style={styles.teamContent}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={[styles.teamSlots, isFull && { color: colors.error }]}>
                    {isFull ? 'Full' : `${openSlots} slot${openSlots !== 1 ? 's' : ''} open`}
                  </Text>
                </View>

                {/* Player avatars */}
                <View style={styles.playerRow}>
                  {team.players.map((p) => (
                    <View key={p} style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>{p[0]}</Text>
                    </View>
                  ))}
                  {Array.from({ length: team.max - team.players.length }).map((_, i) => (
                    <View key={`e${i}`} style={[styles.playerAvatar, styles.playerEmpty]}>
                      <Text style={styles.playerEmptyText}>?</Text>
                    </View>
                  ))}
                </View>

                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: team.color }]}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={handleConfirm}
          disabled={!selected}
          size="lg"
          style={styles.confirmBtn}
        >
          Confirm Team →
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  modalHandle: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  backBtn: { paddingBottom: spacing.md },
  backArrow: { fontSize: 24, color: colors.yellow },

  title: { ...font.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...font.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },

  teams: { gap: spacing.md, paddingBottom: spacing.xl },
  teamCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.subtle,
  },
  teamCardFull: { opacity: 0.5 },
  colorBar: { width: 6 },
  teamContent: { flex: 1, padding: spacing.md, gap: spacing.md },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { ...font.h4, color: colors.text },
  teamSlots: { ...font.bodySmMed, color: colors.success },

  playerRow: { flexDirection: 'row', gap: spacing.xs },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { ...font.bodySmMed, color: colors.text },
  playerEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  playerEmptyText: { ...font.bodySmMed, color: colors.border },

  selectedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  selectedBadgeText: { ...font.captionMed, color: colors.white },

  footer: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  confirmBtn: {},

  confirmContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  confirmDot: { width: 64, height: 64, borderRadius: 32 },
  confirmTitle: { ...font.h2, color: colors.text, textAlign: 'center' },
  confirmSub: { ...font.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  confirmCard: { width: '100%', gap: spacing.md },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingBottom: spacing.sm },
  confirmLabel: { ...font.body, color: colors.textMuted },
  confirmValue: { ...font.bodyMed, color: colors.text },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingBottom: spacing.md },
});
