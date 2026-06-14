import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Badge } from '../../../../components/ui/Badge';
import { Card } from '../../../../components/ui/Card';

type PayStatus = 'paid' | 'unpaid' | 'reserved';
type Filter = 'All' | 'Paid' | 'Unpaid';

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Juan Dela Cruz', status: 'paid' as PayStatus, amount: 150 },
  { id: 'p2', name: 'Mike Santos', status: 'paid' as PayStatus, amount: 150 },
  { id: 'p3', name: 'Carlo Reyes', status: 'unpaid' as PayStatus, amount: 150 },
  { id: 'p4', name: 'Rico Manalo', status: 'paid' as PayStatus, amount: 150 },
  { id: 'p5', name: 'Alex Tan', status: 'reserved' as PayStatus, amount: 150 },
  { id: 'p6', name: 'Ben Cruz', status: 'unpaid' as PayStatus, amount: 150 },
  { id: 'p7', name: 'Chris Valle', status: 'paid' as PayStatus, amount: 150 },
  { id: 'p8', name: 'Dave Pascual', status: 'reserved' as PayStatus, amount: 150 },
];

const FILTER_TABS: Filter[] = ['All', 'Paid', 'Unpaid'];

const STATUS_COLOR: Record<PayStatus, 'green' | 'red' | 'yellow'> = {
  paid: 'green',
  unpaid: 'red',
  reserved: 'yellow',
};

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [filter, setFilter] = useState<Filter>('All');

  const paid = MOCK_PLAYERS.filter((p) => p.status === 'paid');
  const unpaid = MOCK_PLAYERS.filter((p) => p.status === 'unpaid');
  const reserved = MOCK_PLAYERS.filter((p) => p.status === 'reserved');
  const collected = paid.reduce((sum, p) => sum + p.amount, 0);
  const expected = MOCK_PLAYERS.length * 150;

  const filtered = filter === 'All'
    ? MOCK_PLAYERS
    : filter === 'Paid'
    ? paid
    : unpaid;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Friday Night 5v5</Text>
          <Text style={styles.headerSub}>Payments</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statsStrip}>
          {[
            { label: 'Paid', value: paid.length, color: colors.success },
            { label: 'Unpaid', value: unpaid.length, color: colors.error },
            { label: 'Reserved', value: reserved.length, color: colors.warning },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>Expected</Text>
              <Text style={styles.totalsValue}>₱{expected.toLocaleString()}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>Collected</Text>
              <Text style={[styles.totalsValue, { color: colors.success }]}>₱{collected.toLocaleString()}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>Remaining</Text>
              <Text style={[styles.totalsValue, { color: colors.error }]}>₱{(expected - collected).toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(collected / expected) * 100}%` }]} />
          </View>
        </Card>

        <View style={styles.filterRow}>
          {FILTER_TABS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.playerList}>
          {filtered.map((player, i) => (
            <View
              key={player.id}
              style={[styles.playerRow, i < filtered.length - 1 && styles.playerRowBorder]}
            >
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>{player.name[0]}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerAmount}>₱{player.amount}</Text>
              </View>
              <Badge color={STATUS_COLOR[player.status]}>
                {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
              </Badge>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },
  headerRight: { width: 40 },

  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  statsStrip: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  statValue: { ...font.h2 },
  statLabel: { ...font.caption, color: colors.textMuted },

  totalsCard: { gap: spacing.md },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalsItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  totalsLabel: { ...font.caption, color: colors.textMuted },
  totalsValue: { ...font.h4, color: colors.text },
  totalsDivider: { width: 1, height: 36, backgroundColor: colors.borderSubtle },
  progressBar: { height: 6, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.full },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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

  playerList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  playerRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { ...font.bodySmMed, color: colors.yellow },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { ...font.bodyMed, color: colors.text },
  playerAmount: { ...font.caption, color: colors.textMuted },
});
