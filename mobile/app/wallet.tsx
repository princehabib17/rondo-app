import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';
import * as api from '../lib/api';
import type { WalletTransaction } from '../lib/types';

const TOP_UP_PRESETS = [100, 200, 500, 1000, 2000, 5000];

const TX_ICONS: Record<string, string> = {
  payment: '⚽',
  refund: '↩️',
  payout: '🏦',
  adjustment: '⚙️',
};

function txLabel(t: WalletTransaction): string {
  return t.note ?? (
    t.source === 'payment' ? 'Game payment' :
    t.source === 'refund' ? 'Refund' :
    t.source === 'payout' ? 'Payout' : 'Adjustment'
  );
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function groupByDate(txns: WalletTransaction[]): { key: string; items: WalletTransaction[] }[] {
  const map = new Map<string, WalletTransaction[]>();
  for (const tx of txns) {
    const k = dateKey(tx.created_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(tx);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [loadingTopUp, setLoadingTopUp] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const balanceQuery = useQuery(() => q.getWalletBalance(), []);
  const txQuery = useQuery(() => q.getWalletTransactions(), []);

  const balance = balanceQuery.data ?? 0;
  const txns = txQuery.data ?? [];
  const loading = (balanceQuery.loading && !balanceQuery.data) || (txQuery.loading && !txQuery.data);
  const error = balanceQuery.error ?? txQuery.error;

  const refetch = () => { balanceQuery.refetch(); txQuery.refetch(); };

  const handleTopUp = async (amountPHP: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingTopUp(amountPHP);
    setShowPresets(false);
    try {
      const { checkoutUrl } = await api.startWalletTopup(amountPHP * 100);
      await Linking.openURL(checkoutUrl);
      refetch();
    } catch (e) {
      Alert.alert('Top-up failed', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoadingTopUp(null);
    }
  };

  const handleCashOut = () => {
    Alert.alert('Cash Out', 'Cash out feature coming soon.');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Wallet" showBack />
        <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Wallet" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const grouped = groupByDate(txns);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Wallet" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>

        {/* Cash App-style balance hero: huge centered balance + two buttons */}
        <View style={styles.balanceHero}>
          <LinearGradient colors={['#1A1400', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₱{(balance / 100).toLocaleString()}</Text>
          <Text style={styles.balanceSub}>Rondo Wallet</Text>

          {/* Two action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => setShowPresets(!showPresets)}
              style={styles.actionBtn}
              activeOpacity={0.8}
            >
              {loadingTopUp !== null
                ? <ActivityIndicator size="small" color={colors.bg} />
                : <Text style={styles.actionBtnIcon}>＋</Text>
              }
              <Text style={styles.actionBtnLabel}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCashOut}
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnIcon, styles.actionBtnIconSecondary]}>↗</Text>
              <Text style={[styles.actionBtnLabel, styles.actionBtnLabelSecondary]}>Cash Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GCash/Maya-style preset amounts — revealed after tapping Top Up */}
        {showPresets && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Top-up</Text>
            <View style={styles.presetsGrid}>
              {TOP_UP_PRESETS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => handleTopUp(amt)}
                  disabled={loadingTopUp !== null}
                  style={[styles.preset, loadingTopUp === amt && styles.presetLoading]}
                  activeOpacity={0.75}
                >
                  {loadingTopUp === amt ? (
                    <ActivityIndicator size="small" color={colors.yellow} />
                  ) : (
                    <Text style={styles.presetText}>₱{amt.toLocaleString()}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Revolut-style transactions with date group headers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {txns.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.transactions}>
              {grouped.map(({ key, items }) => (
                <View key={key}>
                  <Text style={styles.dateHeader}>{key}</Text>
                  {items.map((tx, i) => (
                    <View key={tx.id} style={[styles.txRow, i < items.length - 1 && styles.txRowBorder]}>
                      <View style={styles.txIcon}>
                        <Text>{TX_ICONS[tx.source] ?? '💳'}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txLabel}>{txLabel(tx)}</Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, tx.direction === 'credit' ? styles.txCredit : styles.txDebit]}>
                        {tx.direction === 'credit' ? '+' : '-'}₱{(tx.amount / 100).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  /* Cash App-style balance hero */
  balanceHero: {
    overflow: 'hidden',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  balanceAmount: { fontSize: 56, fontWeight: '800', color: colors.yellow, letterSpacing: -2 },
  balanceSub: { ...font.caption, color: colors.textFaint, marginBottom: spacing.lg },

  actionRow: { flexDirection: 'row', gap: spacing.md, width: '100%', marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.yellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actionBtnIcon: { fontSize: 22, fontWeight: '700', color: colors.bg },
  actionBtnIconSecondary: { color: colors.text },
  actionBtnLabel: { ...font.bodySmMed, color: colors.bg },
  actionBtnLabelSecondary: { color: colors.textSecondary },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  presetLoading: { backgroundColor: colors.surfaceElevated },
  presetText: { ...font.bodyMed, color: colors.text },

  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...font.body, color: colors.textMuted },

  /* Revolut-style with date group headers */
  transactions: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  dateHeader: {
    ...font.captionMed,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surfaceElevated,
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
