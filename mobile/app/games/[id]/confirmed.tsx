import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Game, Team } from '../../../lib/types';

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId, teamId: rawTeamId } = useLocalSearchParams<{ id: string; teamId?: string }>();
  const id = rawId ?? '';
  const teamId = rawTeamId ?? null;

  const { data: game, loading } = useQuery<Game>(() => q.getGame(id), [id]);
  const { data: teams } = useQuery<Team[]>(() => q.getGameTeams(id), [id]);

  const team = teamId ? (teams ?? []).find((t) => t.id === teamId) ?? null : null;

  const rows: { label: string; value: string }[] = game
    ? [
        { label: 'Game', value: game.title },
        ...(team ? [{ label: 'Team', value: team.name }] : []),
        { label: 'Date', value: formatDateTime(game.date_time) },
        { label: 'Venue', value: game.venue_name },
        { label: game.payment_type === 'venue' ? 'Amount due (at venue)' : 'Amount paid', value: peso(game.price_per_player) },
      ]
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.content}>
        {/* Confetti dots */}
        <View style={[styles.confettiDot, { backgroundColor: colors.yellow, top: 20, left: 30 }]} />
        <View style={[styles.confettiDot, { backgroundColor: colors.success, top: 50, right: 40 }]} />
        <View style={[styles.confettiDot, { backgroundColor: colors.accent, top: 10, right: 80 }]} />
        <View style={[styles.confettiDot, { backgroundColor: colors.error, top: 80, left: 60 }]} />
        <View style={[styles.confettiDot, { backgroundColor: colors.yellow, top: 30, left: 120 }]} />
        <View style={[styles.confettiDot, { backgroundColor: colors.success, top: 70, right: 120 }]} />

        {/* Big checkmark circle */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>

        <Text style={styles.title}>{"You're In!"}</Text>
        <Text style={styles.subtitle}>Your spot is confirmed.</Text>

        {loading && !game ? (
          <ActivityIndicator color={colors.yellow} />
        ) : (
          <Card style={styles.summaryCard}>
            {rows.map((r, i, arr) => (
              <View key={r.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.push(`/games/${id}/chat`)} size="lg" style={styles.btn}>
          Chat with Team 💬
        </Button>
        <Button onPress={() => router.push(`/games/${id}`)} variant="secondary" size="lg" style={styles.btn}>
          View Game Details
        </Button>
        <Button onPress={() => router.replace('/(tabs)/feed')} variant="ghost" size="md">
          Back to Feed
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  confettiDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 48, color: '#FFFFFF', fontWeight: '700', lineHeight: 56 },
  title: { ...font.h1, color: colors.yellow, textAlign: 'center' },
  subtitle: { ...font.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  summaryCard: { width: '100%', gap: 0, padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  rowLabel: { ...font.body, color: colors.textMuted },
  rowValue: { ...font.bodyMed, color: colors.text },
  actions: { gap: spacing.sm },
  btn: {},
});
