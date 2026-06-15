import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '../../../hooks/useQuery';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import type { Tournament } from '../../../lib/types';

const STATUS_LABEL: Record<string, string> = {
  registration: 'Open',
  active: 'Live',
  completed: 'Done',
  cancelled: 'Cancelled',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function OrganizerTournamentsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = user?.id;

  const tournamentsQ = useQuery<Tournament[]>(
    () => (uid ? q.listTournaments({ organizerId: uid }) : Promise.resolve([])),
    [uid],
  );
  const tournaments = tournamentsQ.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tournaments</Text>
        <TouchableOpacity onPress={() => router.push('/organizer/create/tournament')} style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {tournamentsQ.loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.yellow} /></View>
      ) : tournamentsQ.error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{tournamentsQ.error}</Text>
          <TouchableOpacity onPress={() => tournamentsQ.refetch()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : tournaments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tournaments yet. Tap “+ New” to create one.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          {tournaments.map((t) => {
            const status = STATUS_LABEL[t.status] ?? t.status;
            return (
              <TouchableOpacity key={t.id} onPress={() => router.push(`/organizer/tournaments/${t.id}/manage`)} style={styles.card} activeOpacity={0.85}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{t.name}</Text>
                  <Badge color={t.status === 'active' ? 'yellow' : 'green'}>{status}</Badge>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>🏆 {t.format === 'single_elimination' ? 'Knockout' : 'League'}</Text>
                  <Text style={styles.metaText}>📅 {formatDate(t.starts_at)}</Text>
                  <Text style={styles.metaText}>👥 0/{t.max_teams} teams</Text>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: '0%' }]} /></View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  headerTitle: { ...font.h3, color: colors.text },
  newBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow, paddingHorizontal: spacing.md, paddingVertical: 6 },
  newBtnText: { ...font.bodySmMed, color: colors.yellow },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryText: { ...font.bodySmMed, color: colors.accent },
  emptyText: { ...font.body, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { ...font.h4, color: colors.text, flex: 1, marginRight: spacing.sm },
  cardMeta: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  metaText: { ...font.caption, color: colors.textSecondary },
  progressBar: { height: 4, backgroundColor: colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
});
