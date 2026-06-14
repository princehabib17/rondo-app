import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';

const BALANCE = 850;
const TOP_UP_PRESETS = [100, 200, 500, 1000, 2000, 5000];

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'credit', label: 'Top-up via GCash', amount: 500, date: 'Jun 12', icon: '⬆️' },
  { id: '2', type: 'debit', label: 'Friday Night 5v5', amount: -150, date: 'Jun 10', icon: '⚽' },
  { id: '3', type: 'credit', label: 'Refund — Cancelled game', amount: 200, date: 'Jun 8', icon: '↩️' },
  { id: '4', type: 'debit', label: 'Weekend Ballers', amount: -200, date: 'Jun 5', icon: '⚽' },
  { id: '5', type: 'debit', label: 'BGC Summer Cup entry', amount: -300, date: 'Jun 1', icon: '🏆' },
];

const MOCK_PAYOUTS = [
  { id: '1', amount: 1000, status: 'paid', date: 'May 30', bank: 'GCash' },
  { id: '2', amount: 500, status: 'pending', date: 'Jun 8', bank: 'BDO' },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [showCashOut, setShowCashOut] = useState(false);
  const [loadingTopUp, setLoadingTopUp] = useState<number | null>(null);

  const handleTopUp = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingTopUp(amount);
    // Trigger PayMongo checkout
    await new Promise((r) => setTimeout(r, 800));
    setLoadingTopUp(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Wallet" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Balance hero — Cash App style */}
        <View style={styles.balanceHero}>
          <LinearGradient colors={['#1A1400', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₱{BALANCE.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>Updated just now</Text>

          <View style={styles.heroActions}>
            <Button
              onPress={() => { }}
              variant="primary"
              style={styles.heroBtn}
            >
              Top Up
            </Button>
            <Button
              onPress={() => { Haptics.selectionAsync(); setShowCashOut(true); }}
              variant="secondary"
              style={styles.heroBtn}
            >
              Cash Out
            </Button>
          </View>
        </View>

        {/* Top up presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Top-up</Text>
          <View style={styles.presetsGrid}>
            {TOP_UP_PRESETS.map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => handleTopUp(amt)}
                style={[styles.preset, loadingTopUp === amt && styles.presetLoading]}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetText, loadingTopUp === amt && { color: colors.textMuted }]}>
                  ₱{amt.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cash out (collapsed by default) */}
        {showCashOut && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cash Out</Text>
              <TouchableOpacity onPress={() => setShowCashOut(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.payoutForm}>
              <Text style={styles.payoutInfo}>
                Payout requests are processed within 3–5 business days. Minimum payout is ₱100.
              </Text>
              <Button onPress={() => router.push('/organizer/earnings')} variant="secondary">
                Request Payout →
              </Button>
            </View>

            {/* Payout history */}
            <View style={styles.payoutHistory}>
              <Text style={styles.payoutHistoryTitle}>Payout History</Text>
              {MOCK_PAYOUTS.map((p) => (
                <View key={p.id} style={styles.payoutRow}>
                  <View>
                    <Text style={styles.payoutLabel}>{p.bank}</Text>
                    <Text style={styles.payoutDate}>{p.date}</Text>
                  </View>
                  <View style={styles.payoutRight}>
                    <Text style={styles.payoutAmount}>₱{p.amount.toLocaleString()}</Text>
                    <Text style={[styles.payoutStatus, { color: p.status === 'paid' ? colors.success : colors.warning }]}>
                      {p.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.transactions}>
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <View key={tx.id} style={[styles.txRow, i < MOCK_TRANSACTIONS.length - 1 && styles.txRowBorder]}>
                <View style={styles.txIcon}>
                  <Text>{tx.icon}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{tx.label}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, tx.type === 'credit' ? styles.txCredit : styles.txDebit]}>
                  {tx.amount > 0 ? '+' : ''}₱{Math.abs(tx.amount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceHero: {
    overflow: 'hidden',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  balanceAmount: { fontSize: 56, fontWeight: '800', color: colors.yellow, letterSpacing: -2 },
  balanceSub: { ...font.caption, color: colors.textFaint },
  heroActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  heroBtn: { flex: 1 },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  closeBtn: { color: colors.textMuted, fontSize: 18 },

  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetLoading: { backgroundColor: colors.surfaceElevated },
  presetText: { ...font.bodyMed, color: colors.text },

  payoutForm: { gap: spacing.md },
  payoutInfo: { ...font.body, color: colors.textSecondary, lineHeight: 22 },

  payoutHistory: { gap: spacing.sm },
  payoutHistoryTitle: { ...font.bodySmMed, color: colors.textMuted },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  payoutLabel: { ...font.bodyMed, color: colors.text },
  payoutDate: { ...font.caption, color: colors.textMuted },
  payoutRight: { alignItems: 'flex-end', gap: 2 },
  payoutAmount: { ...font.bodyMed, color: colors.text },
  payoutStatus: { ...font.captionMed },

  transactions: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txLabel: { ...font.bodySmMed, color: colors.text },
  txDate: { ...font.caption, color: colors.textMuted },
  txAmount: { ...font.bodyMed },
  txCredit: { color: colors.success },
  txDebit: { color: colors.text },
});
