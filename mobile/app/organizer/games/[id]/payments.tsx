import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Badge } from '../../../../components/ui/Badge';
import { useQuery } from '../../../../hooks/useQuery';
import * as q from '../../../../lib/queries';
import type { GamePlayerWithProfile, GamePlayerStatus } from '../../../../lib/types';

type Filter = 'All' | 'Paid' | 'Unpaid';

const PAID_STATUSES: GamePlayerStatus[] = ['paid', 'approved', 'venue'];
const UNPAID_STATUSES: GamePlayerStatus[] = ['pending', 'pending_payment', 'reserved', 'pending_approval'];

const STATUS_BADGE: Record<GamePlayerStatus, { color: 'green' | 'red' | 'yellow' | 'muted'; label: string }> = {
  paid: { color: 'green', label: 'Paid' },
  approved: { color: 'green', label: 'Approved' },
  venue: { color: 'green', label: 'Pay at Venue' },
  pending: { color: 'yellow', label: 'Pending' },
  pending_payment: { color: 'yellow', label: 'Pending Payment' },
  reserved: { color: 'yellow', label: 'Reserved' },
  pending_approval: { color: 'yellow', label: 'Pending Approval' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'red', label: 'Cancelled' },
  no_show: { color: 'red', label: 'No Show' },
  refund_requested: { color: 'yellow', label: 'Refund Req.' },
  refunded: { color: 'muted', label: 'Refunded' },
};

const FILTER_TABS: Filter[] = ['All', 'Paid', 'Unpaid'];

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<Filter>('All');

  const gameQuery = useQuery(() => q.getGame(gameId!), [gameId]);
  const playersQuery = useQuery(() => q.getGamePlayers(gameId!), [gameId]);

  const game = gameQuery.data;
  const players = useMemo(() => playersQuery.data ?? [], [playersQuery.data]);
  const loading = gameQuery.loading || (playersQuery.loading && !playersQuery.data);

  const filtered = useMemo(() => {
    if (filter === 'Paid') return players.filter((p) => PAID_STATUSES.includes(p.payment_status));
    if (filter === 'Unpaid') return players.filter((p) => UNPAID_STATUSES.includes(p.payment_status));
    return players;
  }, [players, filter]);

  const paidCount = players.filter((p) => PAID_STATUSES.includes(p.payment_status)).length;
  const totalExpected = game ? game.price_per_player * players.length : 0;
  const totalCollected = game ? game.price_per_player * paidCount : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {gameQuery.loading ? 'Loading…' : (game?.title ?? 'Payments')}
          </Text>
          <Text style={styles.headerSub}>Payment Tracker</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
          {/* Summary card */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{paidCount}/{players.length}</Text>
              <Text style={styles.summaryLabel}>Players Paid</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                ₱{(totalCollected / 100).toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Collected</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₱{(totalExpected / 100).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Expected</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {FILTER_TABS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Player list */}
          <View style={styles.list}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No players in this category</Text>
              </View>
            ) : filtered.map((gp: GamePlayerWithProfile, i) => {
              const badgeInfo = STATUS_BADGE[gp.payment_status] ?? { color: 'muted' as const, label: gp.payment_status };
              return (
                <View
                  key={gp.id}
                  style={[styles.playerRow, i < filtered.length - 1 && styles.playerRowBorder]}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {(gp.profile?.full_name?.[0] ?? '?').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{gp.profile?.full_name ?? 'Player'}</Text>
                    {game && (
                      <Text style={styles.playerAmount}>₱{(game.price_per_player / 100).toLocaleString()}</Text>
                    )}
                  </View>
                  <Badge color={badgeInfo.color}>{badgeInfo.label}</Badge>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },

  summary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { ...font.h3, color: colors.text },
  summaryLabel: { ...font.caption, color: colors.textMuted },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.borderSubtle },

  filterRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  filterTab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  filterTabText: { ...font.bodySmMed, color: colors.textMuted },
  filterTabTextActive: { color: colors.yellow },

  list: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  playerRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { ...font.bodySmMed, color: colors.yellow },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { ...font.bodyMed, color: colors.text },
  playerAmount: { ...font.caption, color: colors.textMuted },

  emptyState: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...font.body, color: colors.textMuted },
});
