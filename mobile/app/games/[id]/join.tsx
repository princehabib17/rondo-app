import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQuery, useMutation } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Game, Team, GamePlayerWithProfile } from '../../../lib/types';

const TEAM_FALLBACK_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#EC4899'];

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function firstChar(name: string | null | undefined) {
  return (name ?? '?').trim()[0]?.toUpperCase() ?? '?';
}

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = rawId ?? '';
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data: game, loading: gameLoading, error: gameError, refetch } = useQuery<Game>(() => q.getGame(id), [id]);
  const { data: teams } = useQuery<Team[]>(() => q.getGameTeams(id), [id]);
  const { data: players } = useQuery<GamePlayerWithProfile[]>(() => q.getGamePlayers(id), [id]);

  const joinVenue = useMutation(() => q.joinGameVenue(id, selected));

  const handleSelect = (teamId: string) => {
    Haptics.selectionAsync();
    setSelected(teamId);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirming(true);
  };

  const handleProceed = async () => {
    if (!game) return;
    if (game.payment_type === 'venue') {
      try {
        await joinVenue.mutate(undefined);
        router.replace(`/games/${id}/confirmed${selected ? `?teamId=${selected}` : ''}`);
      } catch (e) {
        Alert.alert('Could not join', e instanceof Error ? e.message : 'Please try again.');
      }
    } else {
      router.replace(`/games/${id}/payment${selected ? `?teamId=${selected}` : ''}`);
    }
  };

  if (gameLoading && !game) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (gameError || !game) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{gameError ?? 'Game not found'}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const teamList = teams ?? [];
  const playerList = players ?? [];
  const perTeamMax = game.num_teams > 0 ? Math.ceil(game.max_players / game.num_teams) : game.max_players;
  const isVenue = game.payment_type === 'venue';

  if (confirming) {
    const team = teamList.find((t) => t.id === selected) ?? null;
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity onPress={() => setConfirming(false)} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.confirmContent}>
          <View style={[styles.confirmDot, { backgroundColor: team?.color || colors.yellow }]} />
          <Text style={styles.confirmTitle}>Join {team?.name ?? game.title}?</Text>
          <Text style={styles.confirmSub}>
            {isVenue
              ? `You're about to join this game. Pay ${peso(game.price_per_player)} at the venue.`
              : `You're about to join this game. Payment of ${peso(game.price_per_player)} will be required to confirm your spot.`}
          </Text>

          <Card style={styles.confirmCard}>
            {!!team && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Team</Text>
                <Text style={styles.confirmValue}>{team.name}</Text>
              </View>
            )}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Game</Text>
              <Text style={styles.confirmValue}>{game.title}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount due</Text>
              <Text style={[styles.confirmValue, { color: colors.yellow }]}>{peso(game.price_per_player)}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.confirmActions}>
          <Button onPress={() => setConfirming(false)} variant="secondary" style={{ flex: 1 }} disabled={joinVenue.loading}>
            Cancel
          </Button>
          <Button onPress={handleProceed} loading={joinVenue.loading} style={{ flex: 1 }}>
            {isVenue ? 'Confirm Spot' : 'Pay & Confirm'}
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
        {teamList.length === 0 ? (
          <Text style={styles.emptyText}>No teams available yet.</Text>
        ) : (
          teamList.map((team, idx) => {
            const teamPlayers = playerList.filter((p) => p.team_id === team.id);
            const isFull = teamPlayers.length >= perTeamMax;
            const openSlots = Math.max(0, perTeamMax - teamPlayers.length);
            const isSelected = selected === team.id;
            const color = team.color || TEAM_FALLBACK_COLORS[idx % TEAM_FALLBACK_COLORS.length];

            return (
              <TouchableOpacity
                key={team.id}
                onPress={() => !isFull && handleSelect(team.id)}
                activeOpacity={isFull ? 1 : 0.85}
                style={[
                  styles.teamCard,
                  isSelected && { borderColor: color, borderWidth: 2 },
                  isFull && styles.teamCardFull,
                ]}
              >
                {/* Color bar */}
                <View style={[styles.colorBar, { backgroundColor: color }]} />

                <View style={styles.teamContent}>
                  <View style={styles.teamHeader}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={[styles.teamSlots, isFull && { color: colors.error }]}>
                      {isFull ? 'Full' : `${openSlots} slot${openSlots !== 1 ? 's' : ''} open`}
                    </Text>
                  </View>

                  {/* Player avatars */}
                  <View style={styles.playerRow}>
                    {teamPlayers.map((p) => (
                      <View key={p.id} style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>{firstChar(p.profile?.full_name)}</Text>
                      </View>
                    ))}
                    {Array.from({ length: openSlots }).map((_, i) => (
                      <View key={`e${i}`} style={[styles.playerAvatar, styles.playerEmpty]}>
                        <Text style={styles.playerEmptyText}>?</Text>
                      </View>
                    ))}
                  </View>

                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: color }]}>
                      <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={handleConfirm}
          disabled={teamList.length > 0 && !selected}
          size="lg"
          style={styles.confirmBtn}
        >
          {teamList.length === 0 ? 'Continue →' : 'Confirm Team →'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  centered: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },
  emptyText: { ...font.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },

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
