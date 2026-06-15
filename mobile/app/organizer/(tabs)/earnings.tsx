import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useQuery, useMutation } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { PayoutRequest, WalletTransaction } from '../../../lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const earnings = useQuery(() => q.getOrganizerEarnings(), []);
  const payouts = useQuery(() => q.getPayoutRequests(), []);
  const submitPayout = useMutation(() =>
    q.requestPayout({
      amount: Math.round(parseFloat(amount) * 100),
      bank_account_name: accountName || undefined,
      bank_name: bankName || undefined,
      bank_account_number: accountNumber || undefined,
    })
  );

  const collected = earnings.data?.collected ?? 0;
  const txns = earnings.data?.txns ?? [];

  // Per-game breakdown from txns: sum credited amounts by game_id
  const breakdown = useMemo(() => {
    const byGame = new Map<string, number>();
    for (const t of txns) {
      if (!t.game_id) continue;
      const delta = t.direction === 'credit' ? t.amount : -t.amount;
      byGame.set(t.game_id, (byGame.get(t.game_id) ?? 0) + delta);
    }
    return [...byGame.entries()].map(([gameId, total]) => ({ gameId, total }));
  }, [txns]);

  const handleSubmit = async () => {
    try {
      await submitPayout.mutate(undefined);
      setShowPayoutForm(false);
      setAmount('');
      setAccountName('');
      setBankName('');
      setAccountNumber('');
      payouts.refetch();
      earnings.refetch();
    } catch {
      // error surfaced via submitPayout.error
    }
  };

  const loading = earnings.loading || payouts.loading;
  const error = earnings.error || payouts.error;

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={() => { earnings.refetch(); payouts.refetch(); }} style={{ marginTop: spacing.md }}>Retry</Button>
      </View>
    );
  }

  const payoutList = payouts.data ?? [];
  const validAmount = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Balance hero */}
        <View style={styles.hero}>
          <LinearGradient colors={['#001A0A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroLabel}>Total earnings collected</Text>
          <Text style={styles.heroAmount}>₱{(collected / 100).toLocaleString()}</Text>
          <Text style={styles.heroSub}>Across {breakdown.length} game{breakdown.length === 1 ? '' : 's'}</Text>
          <Button onPress={() => setShowPayoutForm(!showPayoutForm)} style={styles.payoutBtn}>
            {showPayoutForm ? 'Cancel' : 'Request Payout'}
          </Button>
        </View>

        {/* Payout form */}
        {showPayoutForm && (
          <View style={styles.section}>
            <View style={styles.payoutForm}>
              <Text style={styles.payoutInfo}>Minimum payout ₱100. Processed in 3–5 business days.</Text>
              <TextInput
                style={styles.input}
                placeholder="Amount (₱)"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Account name"
                placeholderTextColor={colors.textMuted}
                value={accountName}
                onChangeText={setAccountName}
              />
              <TextInput
                style={styles.input}
                placeholder="Bank / e-wallet"
                placeholderTextColor={colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
              <TextInput
                style={styles.input}
                placeholder="Account number"
                placeholderTextColor={colors.textMuted}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />
              {submitPayout.error && <Text style={styles.formError}>{submitPayout.error}</Text>}
              <Button onPress={handleSubmit} disabled={!validAmount} loading={submitPayout.loading}>
                Submit Payout Request
              </Button>
            </View>
          </View>
        )}

        {/* Payout history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          {payoutList.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No payout requests yet</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {payoutList.map((p: PayoutRequest, i: number) => (
                <View key={p.id} style={[styles.payoutRow, i < payoutList.length - 1 && styles.payoutRowBorder]}>
                  <View>
                    <Text style={styles.payoutBank}>{p.bank_name || 'Bank transfer'}</Text>
                    <Text style={styles.payoutDate}>{formatDate(p.created_at)}</Text>
                  </View>
                  <View style={styles.payoutRight}>
                    <Text style={styles.payoutAmount}>₱{(p.amount / 100).toLocaleString()}</Text>
                    <Badge color={p.status === 'paid' ? 'green' : p.status === 'rejected' ? 'red' : 'yellow'}>{p.status}</Badge>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Per-game breakdown */}
        {breakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Breakdown</Text>
            <View style={styles.card}>
              {breakdown.map((g, i) => (
                <View key={g.gameId} style={[styles.gameRow, i < breakdown.length - 1 && styles.gameRowBorder]}>
                  <View style={styles.gameLeft}>
                    <Text style={styles.gameName} numberOfLines={1}>Game {g.gameId.slice(0, 8)}</Text>
                  </View>
                  <View style={styles.gameRight}>
                    <Text style={styles.gameCollected}>₱{(g.total / 100).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  emptyText: { ...font.body, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
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
  input: { ...font.body, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  formError: { ...font.caption, color: colors.error },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  payoutRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  payoutBank: { ...font.bodyMed, color: colors.text },
  payoutDate: { ...font.caption, color: colors.textMuted },
  payoutRight: { alignItems: 'flex-end', gap: 4 },
  payoutAmount: { ...font.bodyMed, color: colors.text },
  gameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  gameRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  gameLeft: { gap: 2, flex: 1 },
  gameName: { ...font.bodySmMed, color: colors.text },
  gameDate: { ...font.caption, color: colors.textMuted },
  gameRight: { alignItems: 'flex-end' },
  gameCollected: { ...font.bodyMed, color: colors.success },
  gameExpected: { ...font.caption, color: colors.textMuted },
});
