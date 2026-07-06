import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQuery } from '../../../hooks/useQuery';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import type { GameWithOrganizer, Team, GamePlayerWithProfile } from '../../../lib/types';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;

const TEAM_FALLBACK_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#EC4899'];

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function firstChar(name: string | null | undefined) {
  return (name ?? '?').trim()[0]?.toUpperCase() ?? '?';
}

export default function GameDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = rawId ?? '';
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'teams'>('info');

  const { data: game, loading, error, refetch } = useQuery<GameWithOrganizer>(() => q.getGame(id), [id]);
  const { data: teams } = useQuery<Team[]>(() => q.getGameTeams(id), [id]);
  const { data: players } = useQuery<GamePlayerWithProfile[]>(() => q.getGamePlayers(id), [id]);

  if (loading && !game) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={[styles.container, styles.centered, { padding: spacing.lg, gap: spacing.md }]}>
        <Text style={styles.errorText}>{error ?? 'Game not found'}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const playerList = players ?? [];
  const teamList = teams ?? [];
  const filledCount = playerList.length;
  const spotsLeft = Math.max(0, game.max_players - filledCount);
  const isFull = game.status === 'full' || spotsLeft === 0;
  const alreadyJoined = !!user && playerList.some((p) => p.user_id === user.id);

  // Per-team slot capacity (even split of max_players across teams).
  const perTeamMax = game.num_teams > 0
    ? Math.ceil(game.max_players / game.num_teams)
    : game.max_players;

  return (
    <View style={styles.container}>
      {/* Full-bleed hero */}
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <LinearGradient colors={['#0D2A0D', '#1A3A1A']} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.95)']}
          style={[StyleSheet.absoluteFill, { top: HERO_HEIGHT * 0.4 }]}
        />

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Hero content */}
        <View style={styles.heroContent}>
          <View style={styles.heroTags}>
            <Badge color="yellow">{game.format}</Badge>
            <Badge color={isFull ? 'red' : 'green'}>{isFull ? 'Full' : `${spotsLeft} spots left`}</Badge>
          </View>
          <Text style={styles.heroTitle}>{game.title}</Text>
          <Text style={styles.heroOrganizer}>{game.organizer?.full_name ?? 'Organizer'}</Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Quick info strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{game.venue_address || game.venue_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>{formatFullDate(game.date_time)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>{formatTime(game.date_time)}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['info', 'teams'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'info' ? 'Details' : 'Teams'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'info' && (
          <View style={styles.section}>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Price', value: peso(game.price_per_player) },
                { label: 'Format', value: game.format },
                { label: 'Spots', value: `${filledCount}/${game.max_players}` },
                { label: 'Payment', value: game.payment_type === 'venue' ? 'Pay at venue' : 'Pay online' },
              ].map((s) => (
                <Card key={s.label} style={styles.statCard}>
                  <Text style={styles.statCardLabel}>{s.label}</Text>
                  <Text style={styles.statCardValue}>{s.value}</Text>
                </Card>
              ))}
            </View>

            {/* Description */}
            {!!game.description && (
              <Card style={styles.descCard}>
                <Text style={styles.descTitle}>About this game</Text>
                <Text style={styles.descText}>{game.description}</Text>
              </Card>
            )}

            {/* Organizer */}
            <Card style={styles.organizerCard}>
              <View style={styles.organizerRow}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerAvatarText}>{firstChar(game.organizer?.full_name)}</Text>
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>{game.organizer?.full_name ?? 'Organizer'}</Text>
                  <Text style={styles.organizerLabel}>Organizer</Text>
                </View>
                {!!game.organizer?.id && (
                  <TouchableOpacity onPress={() => router.push(`/profile/${game.organizer!.id}`)} style={styles.viewOrgBtn}>
                    <Text style={styles.viewOrgText}>View</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'teams' && (
          <View style={styles.section}>
            {teamList.length === 0 ? (
              <Text style={styles.emptyTeams}>No teams set up yet.</Text>
            ) : (
              teamList.map((team, idx) => {
                const teamPlayers = playerList.filter((p) => p.team_id === team.id);
                const emptySlots = Math.max(0, perTeamMax - teamPlayers.length);
                const color = team.color || TEAM_FALLBACK_COLORS[idx % TEAM_FALLBACK_COLORS.length];
                return (
                  <Card key={team.id} style={styles.teamCard}>
                    <View style={styles.teamHeader}>
                      <View style={[styles.teamColor, { backgroundColor: color }]} />
                      <Text style={styles.teamName}>{team.name}</Text>
                      <Text style={styles.teamCount}>{teamPlayers.length}/{perTeamMax}</Text>
                    </View>
                    <View style={styles.teamPlayers}>
                      {teamPlayers.map((p) => (
                        <View key={p.id} style={styles.playerChip}>
                          <Text style={styles.playerChipText}>{firstChar(p.profile?.full_name)}</Text>
                        </View>
                      ))}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <View key={`empty-${i}`} style={[styles.playerChip, styles.playerChipEmpty]}>
                          <Text style={styles.playerChipEmptyText}>+</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA — Airbnb style */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPrice}>{peso(game.price_per_player)}</Text>
          <Text style={styles.ctaPer}>per player</Text>
        </View>
        {alreadyJoined ? (
          <Button
            onPress={() => router.push(`/games/${id}/chat`)}
            size="lg"
            style={styles.ctaBtn}
          >
            View Squad Chat
          </Button>
        ) : (
          <Button
            onPress={() => router.push(`/games/${id}/join`)}
            size="lg"
            style={styles.ctaBtn}
          >
            {isFull ? 'Join Waitlist' : 'Join Game'}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  hero: { position: 'relative', justifyContent: 'flex-end' },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },
  heroContent: { padding: spacing.lg, gap: spacing.xs },
  heroTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  heroTitle: { ...font.h1, color: colors.text },
  heroOrganizer: { ...font.bodyMed, color: colors.yellow },

  infoStrip: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: { fontSize: 16, width: 24 },
  infoText: { ...font.body, color: colors.textSecondary, flex: 1 },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.bodyMed, color: colors.textMuted },
  tabTextActive: { color: colors.yellow },

  section: { padding: spacing.lg, gap: spacing.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flex: 1, minWidth: '45%', gap: spacing.xs, alignItems: 'center', padding: spacing.md },
  statCardLabel: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  statCardValue: { ...font.h4, color: colors.text },

  descCard: { gap: spacing.sm },
  descTitle: { ...font.h4, color: colors.text },
  descText: { ...font.body, color: colors.textSecondary, lineHeight: 24 },

  organizerCard: {},
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  organizerAvatarText: { ...font.h4, color: colors.yellow },
  organizerInfo: { flex: 1, gap: 2 },
  organizerName: { ...font.bodyMed, color: colors.text },
  organizerLabel: { ...font.caption, color: colors.textMuted },
  viewOrgBtn: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 6 },
  viewOrgText: { ...font.bodySmMed, color: colors.textSecondary },

  emptyTeams: { ...font.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  teamCard: { gap: spacing.md },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  teamColor: { width: 12, height: 12, borderRadius: 6 },
  teamName: { ...font.h4, color: colors.text, flex: 1 },
  teamCount: { ...font.caption, color: colors.textMuted },
  teamPlayers: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  playerChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  playerChipText: { ...font.bodySmMed, color: colors.text },
  playerChipEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  playerChipEmptyText: { color: colors.border, fontSize: 18 },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  ctaLeft: { gap: 2 },
  ctaPrice: { ...font.h2, color: colors.yellow },
  ctaPer: { ...font.caption, color: colors.textMuted },
  ctaBtn: { flex: 1 },
});
