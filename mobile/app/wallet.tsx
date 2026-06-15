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
import { Button } from '../components/ui/Button';
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
  return t.note ?? (t.source === 'payment' ? 'Game payment' : t.source === 'refund' ? 'Refund' : t.source === 'payout' ? 'Payout' : 'Adjustment');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [loadingTopUp, setLoadingTopUp] = useState<number | null>(null);

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
    try {
      const { checkoutUrl } = await api.startWalletTopup(amountPHP * 100);
      await Linking.openURL(checkoutUrl);
      refetch();
    } catch (e: any) {
      Alert.alert('Top-up failed', e?.message ?? 'Something went wrong');
    } finally {
      setLoadingTopUp(null);
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Wallet" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Balance hero */}
        <View style={styles.balanceHero}>
          <LinearGradient colors={['#1A1400', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₱{(balance / 100).toLocaleString()}</Text>
          <Text style={styles.balanceSub}>Updated just now</Text>
        </View>

        {/* Top up presets */}
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

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {txns.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.transactions}>
              {txns.map((tx, i) => (
                <View key={tx.id} style={[styles.txRow, i < txns.length - 1 && styles.txRowBorder]}>
                  <View style={styles.txIcon}>
                    <Text>{TX_ICONS[tx.source] ?? '💳'}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel}>{txLabel(tx)}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.direction === 'credit' ? styles.txCredit : styles.txDebit]}>
                    {tx.direction === 'credit' ? '+' : '-'}₱{(tx.amount / 100).toLocaleString()}
                  </Text>
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

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

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
    justifyContent: 'center',
    minHeight: 44,
  },
  presetLoading: { backgroundColor: colors.surfaceElevated },
  presetText: { ...font.bodyMed, color: colors.text },

  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...font.body, color: colors.textMuted },

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
