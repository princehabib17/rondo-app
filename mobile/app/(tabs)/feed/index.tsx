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

/* Instagram-style organizer story bubble */
function OrganizerStory({ id, name, verified }: { id: string; name: string; verified: boolean }) {
  return (
    <TouchableOpacity style={styles.story} activeOpacity={0.8} onPress={() => router.push(`/organizers/${id}`)}>
      <View style={[styles.storyRing, verified && styles.storyRingVerified]}>
        <View style={styles.storyAvatar}>
          <Text style={styles.storyInitial}>{name[0]}</Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{name.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}

/* Spotify-style featured card: large with gradient overlay on image area */
function FeaturedCard({ game }: { game: Game }) {
  const isFull = game.status === 'full';
  const left = spotsLeft(game);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.92}
      style={styles.featuredCard}
    >
      {/* Photo area with gradient overlay */}
      <View style={styles.featuredPhoto}>
        <LinearGradient
          colors={['#0D2010', '#1A3A1A', '#0D1A0D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Gradient overlay from bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.9)']}
          style={[StyleSheet.absoluteFill, { top: '40%' }]}
        />
        <View style={styles.featuredSportIcon}>
          <Text style={styles.featuredSportEmoji}>⚽</Text>
        </View>
        <View style={styles.featuredOverlay}>
          <Badge color="yellow" style={styles.featuredBadge}>⚡ FEATURED</Badge>
          <Text style={styles.featuredTitle} numberOfLines={2}>{game.title}</Text>
          <Text style={styles.featuredVenue} numberOfLines={1}>📍 {game.venue_name}</Text>
        </View>
      </View>
      {/* Info strip — Eventbrite style */}
      <View style={styles.featuredFooter}>
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredDate}>{formatDate(game.date_time)}</Text>
          <Badge color="muted">{game.format}</Badge>
        </View>
        <View style={styles.featuredRight}>
          <Text style={styles.featuredPrice}>{peso(game.price_per_player)}</Text>
          <Text style={styles.featuredSpots}>{isFull ? 'Full' : `${left} spots left`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* Eventbrite-style game card: photo + title + date + price + distance */
function GameCard({ game }: { game: Game }) {
  const isFull = game.status === 'full';
  const left = spotsLeft(game);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.88}
      style={[styles.gameCard, shadow.subtle]}
    >
      {/* Photo area */}
      <View style={styles.gamePhoto}>
        <LinearGradient
          colors={['#111A11', '#1A1A0D', '#0A0A0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.gamePhotoEmoji}>⚽</Text>
        <View style={styles.gamePhotoBadges}>
          <Badge color={isFull ? 'red' : 'green'}>{isFull ? 'Full' : `${left} left`}</Badge>
          <Badge color="muted">{game.format}</Badge>
        </View>
      </View>
      {/* Card body */}
      <View style={styles.gameBody}>
        <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.gameMeta} numberOfLines={1}>📍 {game.venue_name}</Text>
        <Text style={styles.gameMeta}>🗓 {formatDate(game.date_time)}</Text>
        <View style={styles.gameFooter}>
          <Text style={styles.gameOrganizer} numberOfLines={1}>by {game.organizer?.full_name ?? 'Organizer'}</Text>
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
          {/* Stories row — Instagram style */}
          {stories.length > 0 && (
            <View style={styles.storiesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {stories.map((o) => (
                  <OrganizerStory key={o.id} id={o.id} name={o.name} verified={false} />
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
              {/* Featured game — Spotify large card */}
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

              {/* Games list — Eventbrite cards */}
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

  /* Spotify-style featured card */
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  featuredPhoto: {
    height: 200,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  featuredSportIcon: {
    position: 'absolute',
    top: 24,
    right: 24,
    opacity: 0.15,
  },
  featuredSportEmoji: { fontSize: 80 },
  featuredOverlay: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  featuredBadge: { alignSelf: 'flex-start', marginBottom: spacing.xs },
  featuredTitle: { ...font.h2, color: colors.white },
  featuredVenue: { ...font.bodySm, color: 'rgba(255,255,255,0.75)' },
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
  featuredRight: { alignItems: 'flex-end', gap: 2 },
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

  /* Eventbrite-style game card */
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gamePhoto: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gamePhotoEmoji: { fontSize: 48, opacity: 0.25 },
  gamePhotoBadges: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gameBody: { padding: spacing.md, gap: spacing.xs },
  gameTitle: { ...font.h4, color: colors.text },
  gameMeta: { ...font.bodySm, color: colors.textSecondary },
  gameFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  gameOrganizer: { ...font.caption, color: colors.textMuted, flex: 1 },
  gamePrice: { ...font.h4, color: colors.yellow },
});
