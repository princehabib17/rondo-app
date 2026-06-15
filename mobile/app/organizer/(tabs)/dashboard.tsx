import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';

const MOCK_STATS = { earned: 12400, games: 18, players: 214 };
const MOCK_GAMES = [
  { id: '1', title: 'Friday Night 5v5', date: 'Fri Jun 20 · 8PM', players: 8, max: 10, status: 'open', earned: 1200 },
  { id: '2', title: 'Sunday League', date: 'Sun Jun 22 · 10AM', players: 14, max: 14, status: 'full', earned: 2800 },
  { id: '3', title: 'BGC Wednesday', date: 'Wed Jun 25 · 7PM', players: 2, max: 10, status: 'open', earned: 300 },
];

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: colors.yellow }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function GameItem({ game }: { game: typeof MOCK_GAMES[0] }) {
  const progress = game.players / game.max;
  return (
    <View style={styles.gameItem}>
      <View style={styles.gameItemLeft}>
        <Text style={styles.gameItemTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.gameItemDate}>{game.date}</Text>
        <View style={styles.gameProgress}>
          <View style={styles.gameProgressBar}>
            <View style={[styles.gameProgressFill, { width: `${progress * 100}%` }, progress >= 1 && styles.gameProgressFull]} />
          </View>
          <Text style={styles.gameProgressLabel}>{game.players}/{game.max} players</Text>
        </View>
      </View>
      <View style={styles.gameItemRight}>
        <Text style={styles.gameItemEarned}>₱{game.earned.toLocaleString()}</Text>
        <View style={styles.gameActions}>
          <TouchableOpacity
            onPress={() => router.push(`/organizer/games/${game.id}/manage`)}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function OrganizerDashboard() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Organizer Mode</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/feed')} style={styles.switchBtn}>
          <Text style={styles.switchText}>← Player</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <LinearGradient colors={['#001A14', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.statsPeriod}>This month</Text>
          <View style={styles.statsRow}>
            <StatCard label="Earned" value={`₱${MOCK_STATS.earned.toLocaleString()}`} accent />
            <View style={styles.statDivider} />
            <StatCard label="Games" value={`${MOCK_STATS.games}`} sub="hosted" />
            <View style={styles.statDivider} />
            <StatCard label="Players" value={`${MOCK_STATS.players}`} sub="total" />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={() => router.push('/organizer/create/index')}
            style={[styles.quickBtn, styles.quickBtnPrimary]}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnIcon}>⚽</Text>
            <Text style={styles.quickBtnLabel}>New Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/organizer/create/tournament')}
            style={[styles.quickBtn, styles.quickBtnSecondary]}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnIcon}>🏆</Text>
            <Text style={styles.quickBtnLabel}>New Tournament</Text>
          </TouchableOpacity>
        </View>

        {/* Games list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Games</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gamesList}>
            {MOCK_GAMES.map((g) => <GameItem key={g.id} game={g} />)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLabel: { ...font.caption, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { ...font.h3, color: colors.text },
  switchBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: { ...font.bodySmMed, color: colors.textSecondary },

  statsStrip: {
    overflow: 'hidden',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  statsPeriod: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statCardAccent: {},
  statLabel: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  statSub: { ...font.caption, color: colors.textFaint },
  statDivider: { width: 1, height: 48, backgroundColor: colors.border },

  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  quickBtnPrimary: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  quickBtnSecondary: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  quickBtnIcon: { fontSize: 20 },
  quickBtnLabel: { ...font.bodyMed, color: colors.text },

  section: { paddingHorizontal: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...font.h4, color: colors.text },
  sectionLink: { ...font.bodySmMed, color: colors.accent },

  gamesList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  gameItemLeft: { flex: 1, gap: spacing.xs },
  gameItemTitle: { ...font.bodyMed, color: colors.text },
  gameItemDate: { ...font.caption, color: colors.textMuted },
  gameProgress: { gap: 4 },
  gameProgressBar: { height: 4, backgroundColor: colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  gameProgressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  gameProgressFull: { backgroundColor: colors.error },
  gameProgressLabel: { ...font.caption, color: colors.textMuted },

  gameItemRight: { alignItems: 'flex-end', gap: spacing.xs },
  gameItemEarned: { ...font.bodyMed, color: colors.success },
  gameActions: {},
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent + '66',
    backgroundColor: colors.accentDim,
  },
  actionBtnText: { ...font.captionMed, color: colors.accent },
});
