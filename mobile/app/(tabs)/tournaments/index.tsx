import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Tournament, TournamentStatus } from '../../../lib/types';

const STATUSES = ['All', 'Open', 'Live', 'Done'] as const;
type Status = typeof STATUSES[number];

const STATUS_MAP: Record<Status, TournamentStatus | null> = {
  All: null,
  Open: 'registration',
  Live: 'active',
  Done: 'completed',
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  registration: 'Open',
  active: 'Live',
  completed: 'Done',
  cancelled: 'Cancelled',
};

function formatFormat(format: Tournament['format']): string {
  return format === 'single_elimination' ? 'Knockout' : 'League';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TournamentCard({ t }: { t: Tournament }) {
  const statusLabel = STATUS_LABEL[t.status] ?? t.status;
  const teams = 0;
  const progress = t.max_teams > 0 ? teams / t.max_teams : 0;
  const statusColor = t.status === 'registration' ? 'green' : t.status === 'active' ? 'yellow' : 'muted';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/tournaments/${t.id}`)}
      activeOpacity={0.88}
      style={[styles.card, shadow.subtle]}
    >
      {/* Card header with gradient */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={t.status === 'active' ? ['#1A1400', '#0A0A0A'] : ['#1A1A2A', '#0A0A0A']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardHeaderContent}>
          <Badge color={statusColor}>{t.status === 'active' ? '🔴 Live' : statusLabel}</Badge>
          <Badge color="muted">{formatFormat(t.format)}</Badge>
        </View>
        <Text style={styles.cardTitle}>{t.name}</Text>
        {t.venue_name ? <Text style={styles.cardOrganizer}>{t.venue_name}</Text> : null}
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        {/* Team progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Teams registered</Text>
            <Text style={styles.progressCount}>
              <Text style={{ color: progress === 1 ? colors.error : colors.yellow }}>{teams}</Text>
              <Text style={{ color: colors.textMuted }}>/{t.max_teams}</Text>
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }, progress === 1 && styles.progressFull]} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Format</Text>
            <Text style={styles.infoValue}>{t.team_size}v{t.team_size}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(t.starts_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Entry</Text>
            <Text style={[styles.infoValue, { color: colors.yellow }]}>₱{(t.entry_fee / 100).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('All');

  const { data, loading, error, refetch } = useQuery(() => q.listTournaments());

  const tournaments = data ?? [];
  const activeStatus = STATUS_MAP[status];
  const filtered = tournaments.filter((t) => activeStatus === null || t.status === activeStatus);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <TouchableOpacity style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🏆 Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.filterPill, status === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, status === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyTitle}>No {status} tournaments</Text>
              <Text style={styles.emptySubtitle}>Check back soon or browse a different status.</Text>
            </View>
          ) : (
            filtered.map((t) => <TournamentCard key={t.id} t={t} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: { ...font.h3, color: colors.text },
  headerBadge: {
    backgroundColor: colors.yellowDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  headerBadgeText: { ...font.captionMed, color: colors.yellow },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  filterText: { ...font.bodySmMed, color: colors.textSecondary },
  filterTextActive: { color: colors.yellow },

  list: { padding: spacing.lg, gap: spacing.md },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: {
    backgroundColor: colors.yellowDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    padding: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  cardHeaderContent: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  cardTitle: { ...font.h3, color: colors.text },
  cardOrganizer: { ...font.caption, color: colors.textMuted },

  cardBody: { padding: spacing.md, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },

  progressSection: { gap: spacing.xs },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...font.caption, color: colors.textSecondary },
  progressCount: { ...font.captionMed },
  progressBar: { height: 6, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.yellow, borderRadius: radius.full },
  progressFull: { backgroundColor: colors.error },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { alignItems: 'center', gap: 2 },
  infoLabel: { ...font.caption, color: colors.textMuted },
  infoValue: { ...font.bodySmMed, color: colors.text },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySubtitle: { ...font.body, color: colors.textMuted, textAlign: 'center' },
});
