import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Badge } from '../components/ui/Badge';

const TABS = ['Upcoming', 'Pending', 'Past'] as const;
type Tab = typeof TABS[number];

const MOCK_GAMES = {
  Upcoming: [
    { id: '1', title: 'Friday Night 5v5', venue: 'Turf Manila, BGC', date: 'Fri Jun 20 · 8PM', format: '5v5', status: 'confirmed', price: 150, team: 'Team Red' },
    { id: '2', title: 'Sunday League', venue: 'Smoke Indoor Futsal, QC', date: 'Sun Jun 22 · 10AM', format: '7v7', status: 'confirmed', price: 200, team: 'Team Blue' },
  ],
  Pending: [
    { id: '3', title: 'Weekday Rondo', venue: 'BGC Court 3', date: 'Wed Jun 18 · 6PM', format: '3v3', status: 'pending_approval', price: 100, team: 'Team A' },
  ],
  Past: [
    { id: '4', title: 'Ballers Cup QF', venue: 'Robinsons Futsaland', date: 'Sat Jun 14 · 4PM', format: '5v5', status: 'completed', price: 200, team: 'Team Red' },
    { id: '5', title: 'Friday Rondo', venue: 'Turf Manila, BGC', date: 'Fri Jun 7 · 8PM', format: '5v5', status: 'completed', price: 150, team: 'Team Blue' },
  ],
};

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'muted'> = {
  confirmed: 'green',
  pending_approval: 'yellow',
  completed: 'muted',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  pending_approval: 'Awaiting approval',
  completed: 'Completed',
};

function GameRow({ game }: { game: typeof MOCK_GAMES.Upcoming[0] }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      style={styles.row}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{game.date.split(' ')[1]}</Text>
          <Text style={styles.dateMonth}>{game.date.split(' ')[0]}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.rowVenue} numberOfLines={1}>📍 {game.venue}</Text>
          <Text style={styles.rowTime}>🕐 {game.date.split('·')[1]?.trim()}</Text>
          <View style={styles.rowTags}>
            <Badge color="muted">{game.format}</Badge>
            <Badge color={STATUS_COLOR[game.status]}>{STATUS_LABEL[game.status]}</Badge>
          </View>
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>₱{game.price}</Text>
        {game.status === 'confirmed' && (
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
  const games = MOCK_GAMES[tab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="My Games" showBack />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {MOCK_GAMES[t].length > 0 && (
              <View style={[styles.tabCount, tab === t && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, tab === t && styles.tabCountTextActive]}>
                  {MOCK_GAMES[t].length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

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
            {games.map((g) => <GameRow key={g.id} game={g} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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

  list: { padding: spacing.lg, gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  rowLeft: { flexDirection: 'row', gap: spacing.md, flex: 1 },
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
