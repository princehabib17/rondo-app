import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '../../../hooks/useQuery';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import type { Game } from '../../../lib/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: colors.yellow }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function GameItem({ game }: { game: Game }) {
  const progress = game.max_players > 0 ? Math.min(1, (game as any).player_count != null ? (game as any).player_count / game.max_players : 0) : 0;
  return (
    <View style={styles.gameItem}>
      <View style={styles.gameItemLeft}>
        <Text style={styles.gameItemTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.gameItemDate}>{formatDate(game.date_time)}</Text>
        <View style={styles.gameProgress}>
          <View style={styles.gameProgressBar}>
            <View style={[styles.gameProgressFill, { width: `${progress * 100}%` }, progress >= 1 && styles.gameProgressFull]} />
          </View>
          <Text style={styles.gameProgressLabel}>{(game as any).player_count ?? 0}/{game.max_players} players</Text>
        </View>
      </View>
      <View style={styles.gameItemRight}>
        <Text style={styles.gameItemEarned}>₱{((game.price_per_player ?? 0) / 100).toLocaleString()}</Text>
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
  const { user } = useAuth();
  const uid = user?.id;

  const gamesQ = useQuery<Game[]>(() => (uid ? q.listGames({ organizerId: uid }) : Promise.resolve([])), [uid]);
  const earningsQ = useQuery(() => q.getOrganizerEarnings(), [uid]);

  const games = gamesQ.data ?? [];
  const earned = earningsQ.data?.collected ?? 0;

  const switchToPlayer = async () => {
    try { await q.updateProfile({ role: 'player' }); } catch {}
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Organizer Mode</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={switchToPlayer} style={styles.switchBtn}>
          <Text style={styles.switchText}>← Player</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <LinearGradient colors={['#001A14', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <Text style={styles.statsPeriod}>This month</Text>
          <View style={styles.statsRow}>
            <StatCard label="Earned" value={`₱${(earned / 100).toLocaleString()}`} accent />
            <View style={styles.statDivider} />
            <StatCard label="Games" value={`${games.length}`} sub="hosted" />
            <View style={styles.statDivider} />
            <StatCard label="Max" value={`${games.reduce((s, g) => s + (g.max_players ?? 0), 0)}`} sub="slots" />
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

          {gamesQ.loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : gamesQ.error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{gamesQ.error}</Text>
              <TouchableOpacity onPress={() => gamesQ.refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : games.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No games yet. Create your first one!</Text>
            </View>
          ) : (
            <View style={styles.gamesList}>
              {games.map((g) => <GameItem key={g.id} game={g} />)}
            </View>
          )}
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

  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryText: { ...font.bodySmMed, color: colors.accent },
  emptyText: { ...font.body, color: colors.textMuted, textAlign: 'center' },

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
