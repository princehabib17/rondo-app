import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const MOCK_GAME = { title: 'Friday Night 5v5', price: 150, team: 'Team Red', date: 'Fri Jun 20 · 8PM', venue: 'Turf Manila, BGC' };
const WALLET_BALANCE = 850;

type Method = 'wallet' | 'online';

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [method, setMethod] = useState<Method>(WALLET_BALANCE >= MOCK_GAME.price ? 'wallet' : 'online');
  const [loading, setLoading] = useState(false);

  const canPayWallet = WALLET_BALANCE >= MOCK_GAME.price;

  const handlePay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.replace(`/games/${id}/confirmed`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      {/* Handle */}
      <View style={styles.handle}><View style={styles.handleBar} /></View>

      <Text style={styles.title}>Payment</Text>

      {/* Game summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>You're joining</Text>
        <Text style={styles.summaryGame}>{MOCK_GAME.title}</Text>
        <Text style={styles.summaryMeta}>🔴 {MOCK_GAME.team}</Text>
        <Text style={styles.summaryMeta}>📅 {MOCK_GAME.date}</Text>
        <Text style={styles.summaryMeta}>📍 {MOCK_GAME.venue}</Text>
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalAmount}>₱{MOCK_GAME.price}</Text>
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
                {canPayWallet ? `Balance: ₱${WALLET_BALANCE}` : `Insufficient — ₱${WALLET_BALANCE} available`}
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
          Pay ₱{MOCK_GAME.price}
        </Button>
        <Text style={styles.secureNote}>🔒 Secured by PayMongo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

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
