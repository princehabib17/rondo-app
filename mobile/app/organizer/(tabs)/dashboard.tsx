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

/* Shopify-style individual stat card */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, shadow.subtle]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function GameItem({ game }: { game: Game }) {
  const playerCount = (game as any).player_count ?? 0;
  const progress = game.max_players > 0 ? Math.min(1, playerCount / game.max_players) : 0;
  const isFull = progress >= 1;
  return (
    <View style={styles.gameItem}>
      <View style={styles.gameItemLeft}>
        <View style={styles.gameItemTop}>
          <Text style={styles.gameItemTitle} numberOfLines={1}>{game.title}</Text>
          <Badge color={isFull ? 'red' : 'green'}>{isFull ? 'Full' : `${game.max_players - playerCount} left`}</Badge>
        </View>
        <Text style={styles.gameItemDate}>{formatDate(game.date_time)}</Text>
        <View style={styles.gameProgress}>
          <View style={styles.gameProgressBar}>
            <View style={[styles.gameProgressFill, { width: `${progress * 100}%` }, isFull && styles.gameProgressFull]} />
          </View>
          <Text style={styles.gameProgressLabel}>{playerCount}/{game.max_players} players</Text>
        </View>
      </View>
      <View style={styles.gameItemRight}>
        <Text style={styles.gameItemEarned}>₱{((game.price_per_player ?? 0) / 100).toLocaleString()}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/organizer/games/${game.id}/manage`)}
          style={styles.manageBtn}
        >
          <Text style={styles.manageBtnText}>Manage</Text>
        </TouchableOpacity>
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
  const totalSlots = games.reduce((s, g) => s + (g.max_players ?? 0), 0);

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

        {/* Shopify-style: 3 separate stat cards */}
        <View style={styles.statCards}>
          <StatCard label="Revenue" value={`₱${(earned / 100).toLocaleString()}`} sub="this month" accent />
          <StatCard label="Games" value={`${games.length}`} sub="hosted" />
          <StatCard label="Capacity" value={`${totalSlots}`} sub="total slots" />
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
            <Text style={styles.sectionPeriod}>All time</Text>
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

  /* Shopify 3-card stats */
  statCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  statLabel: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  statValueAccent: { color: colors.yellow },
  statSub: { ...font.caption, color: colors.textFaint },

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
  sectionPeriod: { ...font.caption, color: colors.textMuted },

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
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  gameItemLeft: { flex: 1, gap: spacing.xs },
  gameItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  gameItemTitle: { ...font.bodyMed, color: colors.text, flex: 1 },
  gameItemDate: { ...font.caption, color: colors.textMuted },
  gameProgress: { gap: 4 },
  gameProgressBar: { height: 4, backgroundColor: colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  gameProgressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  gameProgressFull: { backgroundColor: colors.error },
  gameProgressLabel: { ...font.caption, color: colors.textMuted },

  gameItemRight: { alignItems: 'flex-end', gap: spacing.xs },
  gameItemEarned: { ...font.bodyMed, color: colors.success },
  manageBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent + '66',
    backgroundColor: colors.accentDim,
  },
  manageBtnText: { ...font.captionMed, color: colors.accent },
});
