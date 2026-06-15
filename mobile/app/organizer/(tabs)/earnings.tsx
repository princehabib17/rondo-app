import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

type Period = 'This Month' | 'Last Month' | 'All Time';

const PERIODS: Period[] = ['This Month', 'Last Month', 'All Time'];

const BAR_DATA = [
  { label: 'W1', height: 60 },
  { label: 'W2', height: 90 },
  { label: 'W3', height: 45 },
  { label: 'W4', height: 120 },
];

const MOCK_PAYOUTS = [
  { id: '1', amount: 2400, status: 'paid', date: 'Jun 1', bank: 'GCash' },
  { id: '2', amount: 1800, status: 'pending', date: 'Jun 10', bank: 'BDO' },
];

const MOCK_BREAKDOWN = [
  { game: 'Friday Night 5v5', date: 'Jun 20', collected: 1200, expected: 1500 },
  { game: 'Sunday League', date: 'Jun 22', collected: 2800, expected: 2800 },
  { game: 'BGC Wednesday', date: 'Jun 25', collected: 300, expected: 1500 },
];

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('This Month');
  const total = MOCK_BREAKDOWN.reduce((s, g) => s + g.collected, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Period picker */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setSelectedPeriod(p)}
              style={[styles.periodPill, selectedPeriod === p && styles.periodPillActive]}
            >
              <Text style={[styles.periodPillText, selectedPeriod === p && styles.periodPillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance hero */}
        <View style={styles.hero}>
          <LinearGradient colors={['#001A0A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroLabel}>Total earnings</Text>
          <Text style={styles.heroAmount}>₱{total.toLocaleString()}</Text>
          <Text style={styles.heroSub}>Across {MOCK_BREAKDOWN.length} games</Text>
        </View>

        {/* Bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          <View style={styles.chartCard}>
            <View style={styles.barsContainer}>
              {BAR_DATA.map((bar) => (
                <View key={bar.label} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: bar.height }]} />
                  <Text style={styles.barLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Upcoming payout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Payout</Text>
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingTop}>
              <View>
                <Text style={styles.upcomingLabel}>Next payout</Text>
                <Text style={styles.upcomingAmount}>₱1,800</Text>
                <Text style={styles.upcomingBank}>BDO • ••••1234</Text>
              </View>
            </View>
            <Button style={styles.earlyPayoutBtn} onPress={() => {}}>Request Early Payout</Button>
          </View>
        </View>

        {/* Payout history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          <View style={styles.card}>
            {MOCK_PAYOUTS.map((p, i) => (
              <View key={p.id} style={[styles.payoutRow, i < MOCK_PAYOUTS.length - 1 && styles.payoutRowBorder]}>
                <View>
                  <Text style={styles.payoutBank}>{p.bank}</Text>
                  <Text style={styles.payoutDate}>{p.date}</Text>
                </View>
                <View style={styles.payoutRight}>
                  <Text style={styles.payoutAmount}>₱{p.amount.toLocaleString()}</Text>
                  <Badge color={p.status === 'paid' ? 'green' : 'yellow'}>{p.status}</Badge>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Per-game breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Breakdown</Text>
          <View style={styles.card}>
            {MOCK_BREAKDOWN.map((g, i) => (
              <View key={g.game} style={[styles.gameRow, i < MOCK_BREAKDOWN.length - 1 && styles.gameRowBorder]}>
                <View style={styles.gameLeft}>
                  <Text style={styles.gameName}>{g.game}</Text>
                  <Text style={styles.gameDate}>{g.date}</Text>
                </View>
                <View style={styles.gameRight}>
                  <Text style={styles.gameCollected}>₱{g.collected.toLocaleString()}</Text>
                  <Text style={styles.gameExpected}>/ ₱{g.expected.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  headerTitle: { ...font.h3, color: colors.text },

  periodRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  periodPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  periodPillActive: { backgroundColor: colors.successDim ?? colors.success + '22', borderColor: colors.success },
  periodPillText: { ...font.bodySmMed, color: colors.textSecondary },
  periodPillTextActive: { color: colors.success },

  hero: { overflow: 'hidden', padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  heroLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroAmount: { fontSize: 52, fontWeight: '800', color: colors.success, letterSpacing: -2 },
  heroSub: { ...font.caption, color: colors.textFaint },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },

  chartCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 140, paddingTop: spacing.sm },
  barWrapper: { flex: 1, alignItems: 'center', gap: spacing.xs },
  bar: { flex: 0, width: '100%', backgroundColor: colors.success, borderRadius: 4 },
  barLabel: { ...font.caption, color: colors.textMuted },

  upcomingCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, gap: spacing.md },
  upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  upcomingLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  upcomingAmount: { fontSize: 36, fontWeight: '800', color: colors.success, letterSpacing: -1 },
  upcomingBank: { ...font.bodySmMed, color: colors.textSecondary, marginTop: 4 },
  earlyPayoutBtn: { marginTop: spacing.xs },

  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  payoutRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  payoutBank: { ...font.bodyMed, color: colors.text },
  payoutDate: { ...font.caption, color: colors.textMuted },
  payoutRight: { alignItems: 'flex-end', gap: 4 },
  payoutAmount: { ...font.bodyMed, color: colors.text },

  gameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  gameRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  gameLeft: { gap: 2 },
  gameName: { ...font.bodySmMed, color: colors.text },
  gameDate: { ...font.caption, color: colors.textMuted },
  gameRight: { alignItems: 'flex-end' },
  gameCollected: { ...font.bodyMed, color: colors.success },
  gameExpected: { ...font.caption, color: colors.textMuted },
});
