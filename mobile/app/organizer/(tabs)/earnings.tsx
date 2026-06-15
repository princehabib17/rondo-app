import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

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
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const total = MOCK_BREAKDOWN.reduce((s, g) => s + g.collected, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Balance hero */}
        <View style={styles.hero}>
          <LinearGradient colors={['#001A0A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroLabel}>This month's earnings</Text>
          <Text style={styles.heroAmount}>₱{total.toLocaleString()}</Text>
          <Text style={styles.heroSub}>Across {MOCK_BREAKDOWN.length} games</Text>
          <Button onPress={() => setShowPayoutForm(!showPayoutForm)} style={styles.payoutBtn}>
            {showPayoutForm ? 'Cancel' : 'Request Payout'}
          </Button>
        </View>

        {/* Payout form */}
        {showPayoutForm && (
          <View style={styles.section}>
            <View style={styles.payoutForm}>
              <Text style={styles.payoutInfo}>Minimum payout ₱100. Processed in 3–5 business days.</Text>
              <TouchableOpacity style={styles.bankRow}>
                <Text style={styles.bankLabel}>💳 Select bank / e-wallet</Text>
                <Text style={styles.bankArrow}>›</Text>
              </TouchableOpacity>
              <Button onPress={() => setShowPayoutForm(false)}>Submit Payout Request</Button>
            </View>
          </View>
        )}

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
  hero: { overflow: 'hidden', padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  heroLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroAmount: { fontSize: 52, fontWeight: '800', color: colors.success, letterSpacing: -2 },
  heroSub: { ...font.caption, color: colors.textFaint },
  payoutBtn: { marginTop: spacing.md },
  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  payoutForm: { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  payoutInfo: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  bankLabel: { ...font.bodyMed, color: colors.textSecondary },
  bankArrow: { fontSize: 20, color: colors.textMuted },
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
