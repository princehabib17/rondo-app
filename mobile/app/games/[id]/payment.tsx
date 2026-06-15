import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import * as api from '../../../lib/api';
import { ApiError } from '../../../lib/api';
import type { Game } from '../../../lib/types';

type Method = 'wallet' | 'online';

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId, teamId: rawTeamId } = useLocalSearchParams<{ id: string; teamId?: string }>();
  const id = rawId ?? '';
  const teamId = rawTeamId ?? null;

  const { data: game, loading: gameLoading, error: gameError, refetch } = useQuery<Game>(() => q.getGame(id), [id]);
  const { data: balance } = useQuery<number>(() => q.getWalletBalance(), []);

  const price = game?.price_per_player ?? 0;
  const walletBalance = balance ?? 0;
  const canPayWallet = walletBalance >= price;

  const [method, setMethod] = useState<Method>('online');
  const [loading, setLoading] = useState(false);

  // Default to wallet once we know the balance covers it.
  React.useEffect(() => {
    if (balance !== null && game && canPayWallet) setMethod('wallet');
  }, [balance, game, canPayWallet]);

  const handlePay = async () => {
    if (!game) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (method === 'wallet') {
        await api.payGameWithWallet(id, teamId);
        router.replace(`/games/${id}/confirmed${teamId ? `?teamId=${teamId}` : ''}`);
      } else {
        const { checkoutUrl } = await api.startGameCheckout(id, teamId);
        await Linking.openURL(checkoutUrl);
      }
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'insufficient_balance' || e.code === 'INSUFFICIENT_BALANCE')) {
        Alert.alert('Insufficient balance', 'Your wallet balance is too low. Top up or pay with card.');
      } else {
        Alert.alert('Payment failed', e instanceof Error ? e.message : 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (gameLoading && !game) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (gameError || !game) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{gameError ?? 'Game not found'}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      {/* Handle */}
      <View style={styles.handle}><View style={styles.handleBar} /></View>

      <Text style={styles.title}>Payment</Text>

      {/* Game summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>You're joining</Text>
        <Text style={styles.summaryGame}>{game.title}</Text>
        <Text style={styles.summaryMeta}>📅 {formatDateTime(game.date_time)}</Text>
        <Text style={styles.summaryMeta}>📍 {game.venue_name}</Text>
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalAmount}>{peso(price)}</Text>
        </View>
      </Card>

      {/* Payment method */}
      <Text style={styles.sectionTitle}>Payment method</Text>
      <View style={styles.methods}>
        <TouchableOpacity
          onPress={() => canPayWallet && setMethod('wallet')}
          style={[styles.method, method === 'wallet' && styles.methodActive, !canPayWallet && styles.methodDisabled]}
          activeOpacity={canPayWallet ? 0.8 : 1}
        >
          <View style={styles.methodLeft}>
            <Text style={styles.methodIcon}>💰</Text>
            <View>
              <Text style={styles.methodLabel}>Rondo Wallet</Text>
              <Text style={[styles.methodSub, !canPayWallet && { color: colors.error }]}>
                {canPayWallet ? `Balance: ${peso(walletBalance)}` : `Insufficient — ${peso(walletBalance)} available`}
              </Text>
            </View>
          </View>
          {method === 'wallet' && <View style={styles.methodRadio}><Text style={styles.methodRadioDot}>●</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMethod('online')}
          style={[styles.method, method === 'online' && styles.methodActive]}
        >
          <View style={styles.methodLeft}>
            <Text style={styles.methodIcon}>💳</Text>
            <View>
              <Text style={styles.methodLabel}>GCash / Maya / Card</Text>
              <Text style={styles.methodSub}>Redirects to secure checkout</Text>
            </View>
          </View>
          {method === 'online' && <View style={styles.methodRadio}><Text style={styles.methodRadioDot}>●</Text></View>}
        </TouchableOpacity>
      </View>

      {!canPayWallet && method === 'wallet' && (
        <TouchableOpacity onPress={() => router.push('/wallet')} style={styles.topUpLink}>
          <Text style={styles.topUpText}>Top up wallet →</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Button onPress={handlePay} loading={loading} size="lg" style={styles.payBtn}>
          Pay {peso(price)}
        </Button>
        <Text style={styles.secureNote}>🔒 Secured by PayMongo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  centered: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  handle: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  title: { ...font.h2, color: colors.text, marginBottom: spacing.lg },

  summaryCard: { marginBottom: spacing.lg, gap: spacing.xs },
  summaryLabel: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryGame: { ...font.h3, color: colors.text, marginBottom: spacing.xs },
  summaryMeta: { ...font.body, color: colors.textSecondary },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryTotalLabel: { ...font.bodyMed, color: colors.textSecondary },
  summaryTotalAmount: { ...font.h2, color: colors.yellow },

  sectionTitle: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },

  methods: { gap: spacing.sm, marginBottom: spacing.md },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  methodActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  methodDisabled: { opacity: 0.6 },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodIcon: { fontSize: 24 },
  methodLabel: { ...font.bodyMed, color: colors.text, marginBottom: 2 },
  methodSub: { ...font.caption, color: colors.textMuted },
  methodRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  methodRadioDot: { color: colors.yellow, fontSize: 12 },

  topUpLink: { alignItems: 'center', marginBottom: spacing.md },
  topUpText: { ...font.bodySmMed, color: colors.yellow },

  footer: { marginTop: 'auto', gap: spacing.sm },
  payBtn: {},
  secureNote: { ...font.caption, color: colors.textMuted, textAlign: 'center' },
});
