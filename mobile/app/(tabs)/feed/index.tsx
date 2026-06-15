import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Game } from '../../../lib/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString()}`;
}

function spotsLeft(game: Game) {
  return Math.max(0, game.max_players);
}

function OrganizerStory({ name, verified }: { name: string; verified: boolean }) {
  return (
    <TouchableOpacity style={styles.story} activeOpacity={0.8}>
      <View style={[styles.storyRing, verified && styles.storyRingVerified]}>
        <View style={styles.storyAvatar}>
          <Text style={styles.storyInitial}>{name[0]}</Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{name.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}

function FeaturedCard({ game }: { game: Game }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.92}
      style={styles.featuredCard}
    >
      <View style={styles.featuredBanner}>
        <LinearGradient
          colors={['#1A2A1A', '#0D1A0D']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.featuredLabel}>⚡ FEATURED GAME</Text>
        <Text style={styles.featuredTitle}>{game.title}</Text>
        <Text style={styles.featuredVenue}>📍 {game.venue_name}</Text>
      </View>
      <View style={styles.featuredFooter}>
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredDate}>{formatDate(game.date_time)}</Text>
          <Badge color="yellow">{game.format}</Badge>
        </View>
        <View style={styles.featuredRight}>
          <Text style={styles.featuredPrice}>{peso(game.price_per_player)}</Text>
          <Text style={styles.featuredSpots}>{spotsLeft(game)} spots left</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function GameCard({ game }: { game: Game }) {
  const isFull = game.status === 'full';
  const left = spotsLeft(game);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.88}
      style={[styles.gameCard, shadow.subtle]}
    >
      <View style={styles.gameBanner}>
        <LinearGradient colors={['#1A2418', '#0A0A0A']} style={StyleSheet.absoluteFill} />
        <Badge color={isFull ? 'red' : 'green'} style={styles.gameBadge}>
          {isFull ? 'Full' : `${left} left`}
        </Badge>
        <Text style={styles.gameFormat}>{game.format}</Text>
      </View>
      <View style={styles.gameBody}>
        <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.gameMeta} numberOfLines={1}>📍 {game.venue_name}</Text>
        <Text style={styles.gameMeta}>🕐 {formatDate(game.date_time)}</Text>
        <View style={styles.gameFooter}>
          <Text style={styles.gameOrganizer}>by {game.organizer?.full_name ?? 'Organizer'}</Text>
          <Text style={styles.gamePrice}>{peso(game.price_per_player)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'nearby' | 'upcoming'>('nearby');
  const { data: games, loading, error, refetch } = useQuery(() => q.listGames({ upcomingOnly: true }), []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const list = games ?? [];
  const featured = list[0];
  const rest = list.slice(1);

  // Unique organizers for the stories row.
  const stories = (() => {
    const seen = new Set<string>();
    const out: { id: string; name: string }[] = [];
    for (const g of list) {
      const org = g.organizer;
      if (org && org.id && !seen.has(org.id)) {
        seen.add(org.id);
        out.push({ id: org.id, name: org.full_name ?? 'Organizer' });
      }
    }
    return out;
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good evening 👋</Text>
          <Text style={styles.headerTitle}>Find Your Game</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {loading && !games ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.yellow} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          {/* Stories — Organizers */}
          {stories.length > 0 && (
            <View style={styles.storiesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {stories.map((o) => (
                  <OrganizerStory key={o.id} name={o.name} verified={false} />
                ))}
              </ScrollView>
            </View>
          )}

          {list.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⚽</Text>
              <Text style={styles.emptyTitle}>No games yet</Text>
              <Text style={styles.emptySub}>Check back soon for upcoming games.</Text>
            </View>
          ) : (
            <>
              {/* Featured game */}
              {featured && (
                <View style={styles.section}>
                  <FeaturedCard game={featured} />
                </View>
              )}

              {/* Nearby / Upcoming tabs */}
              <View style={styles.tabsRow}>
                {(['nearby', 'upcoming'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                    <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                      {t === 'nearby' ? '📍 Nearby' : '📅 Upcoming'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Games list */}
              <View style={styles.gamesList}>
                {rest.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySub: { ...font.body, color: colors.textSecondary, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerGreeting: { ...font.caption, color: colors.textMuted },
  headerTitle: { ...font.h3, color: colors.text },
  bellBtn: { position: 'relative', padding: spacing.xs },
  bellIcon: { fontSize: 22 },
  bellDot: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },

  storiesSection: { paddingVertical: spacing.md },
  storiesScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  story: { alignItems: 'center', width: 64 },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 2,
    marginBottom: 6,
  },
  storyRingVerified: { borderColor: colors.yellow },
  storyAvatar: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitial: { ...font.h4, color: colors.yellow },
  storyName: { ...font.caption, color: colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },

  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  featuredBanner: {
    height: 140,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  featuredLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, marginBottom: spacing.xs },
  featuredTitle: { ...font.h2, color: colors.text, marginBottom: spacing.xs },
  featuredVenue: { ...font.bodySm, color: colors.textSecondary },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  featuredInfo: { gap: spacing.xs },
  featuredDate: { ...font.bodySmMed, color: colors.text },
  featuredRight: { alignItems: 'flex-end' },
  featuredPrice: { ...font.h3, color: colors.yellow },
  featuredSpots: { ...font.caption, color: colors.textMuted },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textSecondary },
  tabTextActive: { color: colors.yellow },

  gamesList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gameBanner: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  gameBadge: {},
  gameFormat: { ...font.captionMed, color: colors.textSecondary },
  gameBody: { padding: spacing.md, gap: spacing.xs },
  gameTitle: { ...font.h4, color: colors.text },
  gameMeta: { ...font.bodySm, color: colors.textSecondary },
  gameFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  gameOrganizer: { ...font.caption, color: colors.textMuted },
  gamePrice: { ...font.h4, color: colors.yellow },
});
