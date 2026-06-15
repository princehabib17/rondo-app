import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Badge } from '../components/ui/Badge';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';
import type { Game, GamePlayer, GamePlayerStatus } from '../lib/types';

const TABS = ['Upcoming', 'Pending', 'Past'] as const;
type Tab = typeof TABS[number];

type MyGameRow = GamePlayer & { game: Game | null };

const PENDING_STATUSES: GamePlayerStatus[] = ['pending', 'pending_payment', 'reserved', 'pending_approval'];
const JOINED_STATUSES: GamePlayerStatus[] = ['approved', 'paid', 'venue'];

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'muted' | 'red'> = {
  paid: 'green',
  approved: 'green',
  venue: 'green',
  pending: 'yellow',
  pending_payment: 'yellow',
  pending_approval: 'yellow',
  reserved: 'yellow',
  completed: 'muted',
  cancelled: 'red',
  rejected: 'red',
  refunded: 'muted',
  refund_requested: 'yellow',
  no_show: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Confirmed',
  approved: 'Confirmed',
  venue: 'Pay at venue',
  pending: 'Pending',
  pending_payment: 'Awaiting payment',
  pending_approval: 'Awaiting approval',
  reserved: 'Reserved',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  refunded: 'Refunded',
  refund_requested: 'Refund requested',
  no_show: 'No show',
};

const STATUS_LEFT_BORDER: Record<string, string> = {
  paid: colors.success,
  approved: colors.success,
  venue: colors.success,
  pending: colors.yellow,
  pending_payment: colors.yellow,
  pending_approval: colors.yellow,
  reserved: colors.yellow,
  cancelled: colors.error,
  rejected: colors.error,
  no_show: colors.error,
};

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function dayNum(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric' });
}
function monthShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short' });
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function GameRow({ row }: { row: MyGameRow }) {
  const game = row.game;
  if (!game) return null;
  const status = row.payment_status;
  const joined = JOINED_STATUSES.includes(status);
  const leftBorderColor = STATUS_LEFT_BORDER[status] ?? colors.border;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      style={styles.row}
      activeOpacity={0.8}
    >
      {/* Colored left border accent */}
      <View style={[styles.leftAccent, { backgroundColor: leftBorderColor }]} />

      <View style={styles.rowLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{dayNum(game.date_time)}</Text>
          <Text style={styles.dateMonth}>{monthShort(game.date_time)}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.rowVenue} numberOfLines={1}>📍 {game.venue_name}</Text>
          <Text style={styles.rowTime}>🕐 {timeLabel(game.date_time)}</Text>
          <View style={styles.rowTags}>
            <Badge color="muted">{game.format}</Badge>
            <Badge color={STATUS_COLOR[status] ?? 'muted'}>{STATUS_LABEL[status] ?? status}</Badge>
          </View>
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{peso(game.price_per_player)}</Text>
        {joined && (
          <TouchableOpacity onPress={() => router.push(`/games/${game.id}/chat`)} style={styles.chatBtn}>
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MyGamesScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('Upcoming');
  const { data, loading, error, refetch } = useQuery<MyGameRow[]>(() => q.getMyGames(), []);

  const grouped = useMemo(() => {
    const now = Date.now();
    const rows = (data ?? []).filter((r) => r.game);
    const upcoming: MyGameRow[] = [];
    const pending: MyGameRow[] = [];
    const past: MyGameRow[] = [];
    for (const r of rows) {
      const t = new Date(r.game!.date_time).getTime();
      if (PENDING_STATUSES.includes(r.payment_status)) pending.push(r);
      else if (t >= now) upcoming.push(r);
      else past.push(r);
    }
    return { Upcoming: upcoming, Pending: pending, Past: past } as Record<Tab, MyGameRow[]>;
  }, [data]);

  const games = grouped[tab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="My Games" showBack />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {grouped[t].length > 0 && (
              <View style={[styles.tabCount, tab === t && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, tab === t && styles.tabCountTextActive]}>
                  {grouped[t].length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
          {games.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No {tab.toLowerCase()} games</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
                <Text style={styles.emptyLink}>Browse games →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {games.map((g) => <GameRow key={g.id} row={g} />)}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  tabActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textSecondary },
  tabTextActive: { color: colors.yellow },
  tabCount: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tabCountActive: { backgroundColor: colors.yellow },
  tabCountText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  tabCountTextActive: { color: colors.bg },

  list: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    overflow: 'hidden',
    gap: spacing.md,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  rowLeft: { flexDirection: 'row', gap: spacing.md, flex: 1, marginLeft: spacing.xs },
  dateBox: {
    width: 44,
    height: 52,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateDay: { ...font.h4, color: colors.yellow },
  dateMonth: { ...font.caption, color: colors.textMuted },
  rowInfo: { flex: 1, gap: spacing.xs },
  rowTitle: { ...font.bodyMed, color: colors.text },
  rowVenue: { ...font.caption, color: colors.textSecondary },
  rowTime: { ...font.caption, color: colors.textMuted },
  rowTags: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },

  rowRight: { alignItems: 'flex-end', gap: spacing.sm },
  rowPrice: { ...font.bodyMed, color: colors.yellow },
  chatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  chatIcon: { fontSize: 16 },

  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptyLink: { ...font.bodyMed, color: colors.yellow },
});
