import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function ConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.content}>
        <Text style={styles.checkmark}>✅</Text>
        <Text style={styles.title}>You're in!</Text>
        <Text style={styles.subtitle}>Your spot is confirmed. See you on the pitch.</Text>

        <Card style={styles.summaryCard}>
          {[
            { label: 'Game', value: 'Friday Night 5v5' },
            { label: 'Team', value: '🔴 Team Red' },
            { label: 'Date', value: 'Fri Jun 20 · 8:00 PM' },
            { label: 'Venue', value: 'Turf Manila, BGC' },
            { label: 'Amount paid', value: '₱150' },
          ].map((r, i, arr) => (
            <View key={r.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.push(`/games/${id}/chat`)} size="lg" style={styles.btn}>
          Chat with Team 💬
        </Button>
        <Button onPress={() => router.push(`/games/${id}`)} variant="secondary" size="lg" style={styles.btn}>
          View Game Details
        </Button>
        <Button onPress={() => router.replace('/(tabs)/feed')} variant="ghost" size="md">
          Back to Feed
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  checkmark: { fontSize: 80 },
  title: { ...font.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...font.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  summaryCard: { width: '100%', gap: 0, padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  rowLabel: { ...font.body, color: colors.textMuted },
  rowValue: { ...font.bodyMed, color: colors.text },
  actions: { gap: spacing.sm },
  btn: {},
});
